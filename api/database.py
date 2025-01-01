from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    DATABASE_URL = "postgresql://neondb_owner:JOZv4B3iPYuF@ep-soft-cloud-a1tydbjr.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Keyword(Base):
    __tablename__ = "keyword"
    
    id = Column(Integer, primary_key=True)
    pw = Column(String)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    points_basic = Column(Integer, default=10)
    points_advanced = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

# 只创建不存在的表
Base.metadata.create_all(bind=engine, checkfirst=True) 