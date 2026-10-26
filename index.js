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

const biodataSchema = Joi.object({
    id: Joi.number().integer().positive(),
    nama: Joi.string().trim().min(2).max(100).required(),
    nim: Joi.string().trim().min(5).max(20).required(),
    kelas: Joi.string().trim().min(1).max(10).required()
}).options({
    abortEarly: false,
    convert: true,
    allowUnknown: false
})

const idSchema = Joi.object({
    id: Joi.number().integer().positive().required()
}).options({
    abortEarly: false,
    convert: true,
    allowUnknown: false
})

function validationDetails(error) {
    return error.details.map(item => ({
        field: item.path.join('.'),
        message: item.message
    }))
}

function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body)

        if (error) {
            return errorResponse(res, 'Validasi input gagal', 400, validationDetails(error))
        }

        req.body = value
        next()
    }
}

function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params)

        if (error) {
            return errorResponse(res, 'Parameter tidak valid', 400, validationDetails(error))
        }

        req.params = value
        next()
    }
}

const updateBiodataSchema = biodataSchema
    .fork(['nama', 'nim', 'kelas'], field => field.required())
    .fork(['id'], field => field.forbidden())

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
