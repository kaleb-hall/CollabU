# Database Setup Guide

## Install PostgreSQL
Mac: brew install postgresql@14
Ubuntu: sudo apt-get install postgresql-14
Windows: Download from postgresql.org

## Create Database
psql postgres
CREATE DATABASE collabu;
CREATE USER collabu_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE collabu TO collabu_user;
\q

## Run Schema
psql -U collabu_user -d collabu -f database/schema.sql

## Update backend/.env
DATABASE_URL=postgresql://collabu_user:your_password@localhost/collabu

## Verify
psql -U collabu_user -d collabu
\dt
