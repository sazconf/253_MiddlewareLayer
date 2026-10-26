const express = require('express')
const { Pool } = require('pg')
const Joi = require('joi')

const app = express()
const port = Number(process.env.PORT) || 3000

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'mahasiswa',
    password: process.env.PGPASSWORD || '1234',
    port: Number(process.env.PGPORT) || 5432
})

