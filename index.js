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

app.use(express.json())

app.use((req, res, next) => {
    req.pool = pool
    next()
})

function successResponse(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        error: null
    })
}

function errorResponse(res, message, statusCode, details = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
        error: details
    })
}

app.use((req, res, next) => {
    const start = Date.now()

    res.on('finish', () => {
        console.log({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${Date.now() - start}ms`
        })
    })

    next()
})
