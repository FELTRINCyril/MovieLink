from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "votre_secret_key_tres_securise_pour_jwt"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

# Create the main app
app = FastAPI(title="MovieHub API")
api_router = APIRouter(prefix="/api")

# Pydantic Models
class Genre(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # "movie" or "actor"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Movie(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: Optional[str] = None
    image: Optional[str] = None
    image_settings: Optional[dict] = {"scale": 100, "positionX": 50, "positionY": 50}
    actors: List[str] = []  # IDs des acteurs
    description: Optional[str] = None
    genres: List[str] = []  # IDs des genres
    duration: Optional[int] = None  # en minutes
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Actor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: Optional[int] = None
    image: Optional[str] = None
    image_settings: Optional[dict] = {"scale": 100, "positionX": 50, "positionY": 50}
    movies: List[str] = []  # IDs des films
    description: Optional[str] = None
    genres: List[str] = []  # IDs des genres (ex: "comique", "action")
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    is_admin: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class MovieCreate(BaseModel):
    title: str
    url: Optional[str] = None
    image: Optional[str] = None
    actors: List[str] = []
    description: Optional[str] = None
    genres: List[str] = []
    duration: Optional[int] = None

class ActorCreate(BaseModel):
    name: str
    age: Optional[int] = None
    image: Optional[str] = None
    movies: List[str] = []
    description: Optional[str] = None
    genres: List[str] = []

class GenreCreate(BaseModel):
    name: str
    type: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Utility functions
def verify_password(plain_password, hashed_password):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

# Auth endpoints
@api_router.get("/")
async def root():
    return {"message": "MovieHub API is running"}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Movies endpoints
@api_router.get("/movies", response_model=List[Movie])
async def get_movies(skip: int = 0, limit: int = 100):
    movies = await db.movies.find().skip(skip).limit(limit).to_list(limit)
    return [Movie(**movie) for movie in movies]

@api_router.get("/movies/featured")
async def get_featured_movie():
    movie = await db.movies.find_one({}, sort=[("created_at", -1)])
    if movie:
        return Movie(**movie)
    return None

@api_router.get("/movies/recent", response_model=List[Movie])
async def get_recent_movies(limit: int = 6):
    movies = await db.movies.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [Movie(**movie) for movie in movies]

@api_router.get("/movies/favorites", response_model=List[Movie])
async def get_favorite_movies(limit: int = 6):
    movies = await db.movies.find({"is_favorite": True}).limit(limit).to_list(limit)
    return [Movie(**movie) for movie in movies]

@api_router.get("/movies/by-genre/{genre_id}", response_model=List[Movie])
async def get_movies_by_genre(genre_id: str, limit: int = 6):
    movies = await db.movies.find({"genres": genre_id}).limit(limit).to_list(limit)
    return [Movie(**movie) for movie in movies]

@api_router.post("/movies", response_model=Movie)
async def create_movie(movie: MovieCreate, current_user: User = Depends(get_current_user)):
    movie_dict = movie.dict()
    movie_obj = Movie(**movie_dict)
    movie_data = prepare_for_mongo(movie_obj.dict())
    await db.movies.insert_one(movie_data)
    
    # Liaison bidirectionnelle avec les acteurs
    for actor_id in movie_obj.actors:
        actor = await db.actors.find_one({"id": actor_id})
        if actor and movie_obj.id not in actor.get("movies", []):
            await db.actors.update_one(
                {"id": actor_id}, 
                {"$addToSet": {"movies": movie_obj.id}}
            )
    
    return movie_obj

@api_router.put("/movies/{movie_id}", response_model=Movie)
async def update_movie(movie_id: str, movie: MovieCreate, current_user: User = Depends(get_current_user)):
    # Récupérer l'ancien film pour gérer les liaisons
    old_movie = await db.movies.find_one({"id": movie_id})
    if not old_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie_data = prepare_for_mongo(movie.dict())
    await db.movies.update_one({"id": movie_id}, {"$set": movie_data})
    
    # Gérer les liaisons bidirectionnelles
    old_actors = set(old_movie.get("actors", []))
    new_actors = set(movie.actors)
    
    # Retirer le film des acteurs qui ne sont plus liés
    for actor_id in old_actors - new_actors:
        await db.actors.update_one(
            {"id": actor_id}, 
            {"$pull": {"movies": movie_id}}
        )
    
    # Ajouter le film aux nouveaux acteurs
    for actor_id in new_actors - old_actors:
        await db.actors.update_one(
            {"id": actor_id}, 
            {"$addToSet": {"movies": movie_id}}
        )
    
    updated_movie = await db.movies.find_one({"id": movie_id})
    if updated_movie:
        return Movie(**updated_movie)
    raise HTTPException(status_code=404, detail="Movie not found")

@api_router.delete("/movies/{movie_id}")
async def delete_movie(movie_id: str, current_user: User = Depends(get_current_user)):
    result = await db.movies.delete_one({"id": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"message": "Movie deleted"}

@api_router.patch("/movies/{movie_id}/favorite")
async def toggle_movie_favorite(movie_id: str):
    movie = await db.movies.find_one({"id": movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    new_favorite_status = not movie.get("is_favorite", False)
    await db.movies.update_one({"id": movie_id}, {"$set": {"is_favorite": new_favorite_status}})
    return {"is_favorite": new_favorite_status}

# Actors endpoints
@api_router.get("/actors", response_model=List[Actor])
async def get_actors(skip: int = 0, limit: int = 100):
    actors = await db.actors.find().skip(skip).limit(limit).to_list(limit)
    return [Actor(**actor) for actor in actors]

@api_router.post("/actors", response_model=Actor)
async def create_actor(actor: ActorCreate, current_user: User = Depends(get_current_user)):
    actor_dict = actor.dict()
    actor_obj = Actor(**actor_dict)
    actor_data = prepare_for_mongo(actor_obj.dict())
    await db.actors.insert_one(actor_data)
    
    # Liaison bidirectionnelle avec les films
    for movie_id in actor_obj.movies:
        movie = await db.movies.find_one({"id": movie_id})
        if movie and actor_obj.id not in movie.get("actors", []):
            await db.movies.update_one(
                {"id": movie_id}, 
                {"$addToSet": {"actors": actor_obj.id}}
            )
    
    return actor_obj

@api_router.put("/actors/{actor_id}", response_model=Actor)
async def update_actor(actor_id: str, actor: ActorCreate, current_user: User = Depends(get_current_user)):
    # Récupérer l'ancien acteur pour gérer les liaisons
    old_actor = await db.actors.find_one({"id": actor_id})
    if not old_actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    actor_data = prepare_for_mongo(actor.dict())
    await db.actors.update_one({"id": actor_id}, {"$set": actor_data})
    
    # Gérer les liaisons bidirectionnelles
    old_movies = set(old_actor.get("movies", []))
    new_movies = set(actor.movies)
    
    # Retirer l'acteur des films qui ne sont plus liés
    for movie_id in old_movies - new_movies:
        await db.movies.update_one(
            {"id": movie_id}, 
            {"$pull": {"actors": actor_id}}
        )
    
    # Ajouter l'acteur aux nouveaux films
    for movie_id in new_movies - old_movies:
        await db.movies.update_one(
            {"id": movie_id}, 
            {"$addToSet": {"actors": actor_id}}
        )
    
    updated_actor = await db.actors.find_one({"id": actor_id})
    if updated_actor:
        return Actor(**updated_actor)
    raise HTTPException(status_code=404, detail="Actor not found")

@api_router.delete("/actors/{actor_id}")
async def delete_actor(actor_id: str, current_user: User = Depends(get_current_user)):
    result = await db.actors.delete_one({"id": actor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Actor not found")
    return {"message": "Actor deleted"}

@api_router.patch("/actors/{actor_id}/favorite")
async def toggle_actor_favorite(actor_id: str):
    actor = await db.actors.find_one({"id": actor_id})
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    new_favorite_status = not actor.get("is_favorite", False)
    await db.actors.update_one({"id": actor_id}, {"$set": {"is_favorite": new_favorite_status}})
    return {"is_favorite": new_favorite_status}

# Genres endpoints
@api_router.get("/genres", response_model=List[Genre])
async def get_genres(type: Optional[str] = None):
    query = {"type": type} if type else {}
    genres = await db.genres.find(query).to_list(100)
    return [Genre(**genre) for genre in genres]

@api_router.post("/genres", response_model=Genre)
async def create_genre(genre: GenreCreate, current_user: User = Depends(get_current_user)):
    genre_obj = Genre(**genre.dict())
    genre_data = prepare_for_mongo(genre_obj.dict())
    await db.genres.insert_one(genre_data)
    return genre_obj

@api_router.delete("/genres/{genre_id}")
async def delete_genre(genre_id: str, current_user: User = Depends(get_current_user)):
    result = await db.genres.delete_one({"id": genre_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Genre not found")
    return {"message": "Genre deleted"}

# Favorites endpoints
@api_router.get("/favorites")
async def get_favorites():
    favorites = {"movies": [], "actors": []}
    
    favorite_movies = await db.movies.find({"is_favorite": True}).to_list(100)
    favorites["movies"] = [Movie(**movie) for movie in favorite_movies]
    
    favorite_actors = await db.actors.find({"is_favorite": True}).to_list(100)
    favorites["actors"] = [Actor(**actor) for actor in favorite_actors]
    
    return favorites

# Search endpoint
@api_router.get("/search")
async def search(q: str, type: Optional[str] = None):
    results = {"movies": [], "actors": []}
    
    if not type or type == "movies":
        movies = await db.movies.find({
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(20)
        results["movies"] = [Movie(**movie) for movie in movies]
    
    if not type or type == "actors":
        actors = await db.actors.find({
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(20)
        results["actors"] = [Actor(**actor) for actor in actors]
    
    return results

# Initialize data
@api_router.post("/init-data")
async def init_sample_data():
    # Check if data already exists
    existing_movies = await db.movies.count_documents({})
    if existing_movies > 0:
        return {"message": "Data already exists"}
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password_hash": get_password_hash("admin123"),
        "is_admin": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Create sample genres
    movie_genres = [
        {"id": str(uuid.uuid4()), "name": "Action", "type": "movie", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Comédie", "type": "movie", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Drame", "type": "movie", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Sci-Fi", "type": "movie", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Horreur", "type": "movie", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    
    actor_genres = [
        {"id": str(uuid.uuid4()), "name": "Action", "type": "actor", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Comédie", "type": "actor", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Drame", "type": "actor", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    
    await db.genres.insert_many(movie_genres + actor_genres)
    
    # Create sample actors
    actors = [
        {
            "id": str(uuid.uuid4()),
            "name": "Leonardo DiCaprio",
            "age": 49,
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmLMnelGCKCLTRHYxRqB7_AjmP5lBZa3NhxA&usqp=CAU",
            "movies": [],
            "description": "Acteur et producteur américain, multiple oscarisé",
            "genres": [actor_genres[2]["id"]],  # Drame
            "is_favorite": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Scarlett Johansson",
            "age": 39,
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHzk7X8KH8_Yzng-LDt6xKTFQ-LLqVbC4Muw&usqp=CAU",
            "movies": [],
            "description": "Actrice américaine polyvalente",
            "genres": [actor_genres[0]["id"]],  # Action
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ryan Gosling",
            "age": 43,
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyGn_JEA7x2BKfQ0tNW8qJPxl-hfPnLzwgTw&usqp=CAU",
            "movies": [],
            "description": "Acteur et musicien canadien",
            "genres": [actor_genres[2]["id"]],  # Drame
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    inserted_actors = await db.actors.insert_many(actors)
    actor_ids = [str(actor["id"]) for actor in actors]
    
    # Create sample movies
    movies = [
        {
            "id": str(uuid.uuid4()),
            "title": "Inception",
            "url": "https://example.com/inception",
            "image": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
            "actors": [actor_ids[0]],  # Leonardo DiCaprio
            "description": "Un voleur qui s'infiltre dans les rêves des autres doit accomplir l'impossible : l'inception.",
            "genres": [movie_genres[3]["id"]],  # Sci-Fi
            "duration": 148,
            "is_favorite": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Black Widow",
            "url": "https://example.com/black-widow",
            "image": "https://m.media-amazon.com/images/M/MV5BNjRmNDI5MjMtMmFhZi00NzYzLWIzMGEtNGJmNzEyODU2OTVjXkEyXkFqcGdeQXVyNjg2NjQwMDQ@._V1_.jpg",
            "actors": [actor_ids[1]],  # Scarlett Johansson
            "description": "Natasha Romanoff affronte son passé et une conspiration menaçante.",
            "genres": [movie_genres[0]["id"]],  # Action
            "duration": 134,
            "is_favorite": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "La La Land",
            "url": "https://example.com/la-la-land",
            "image": "https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_.jpg",
            "actors": [actor_ids[2]],  # Ryan Gosling
            "description": "Une histoire d'amour moderne entre un pianiste de jazz et une actrice aspirante à Los Angeles.",
            "genres": [movie_genres[2]["id"]],  # Drame
            "duration": 128,
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Titanic",
            "url": "https://example.com/titanic",
            "image": "https://m.media-amazon.com/images/M/MV5BMDdmZGU3NDQtY2E5My00ZTliLWIzOTUtMTY4ZGI1YjdiNjk3XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_.jpg",
            "actors": [actor_ids[0]],  # Leonardo DiCaprio
            "description": "Une histoire d'amour épique sur le navire le plus célèbre du monde.",
            "genres": [movie_genres[2]["id"]],  # Drame
            "duration": 195,
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Wolf of Wall Street",
            "url": "https://example.com/wolf-wall-street",
            "image": "https://m.media-amazon.com/images/M/MV5BMjIxMjgxNTk0MF5BMl5BanBnXkFtZTgwNjIyOTg2MDE@._V1_.jpg",
            "actors": [actor_ids[0]],  # Leonardo DiCaprio
            "description": "L'histoire vraie de Jordan Belfort, de son ascension à la chute spectaculaire de sa carrière de courtier.",
            "genres": [movie_genres[2]["id"]],  # Drame
            "duration": 180,
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.movies.insert_many(movies)
    
    return {"message": "Sample data created successfully"}

# Include router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()