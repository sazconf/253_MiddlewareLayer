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

app.get('/', async (req, res) => {
    const result = await req.pool.query('SELECT * FROM biodata ORDER BY id')
    return successResponse(res, 'Data berhasil diambil', result.rows)
})

app.get('/biodata', async (req, res) => {
    const result = await req.pool.query('SELECT * FROM biodata ORDER BY id')
    return successResponse(res, 'Data berhasil diambil', result.rows)
})

app.get('/biodata/:id', validateParams(idSchema), async (req, res) => {
    const result = await req.pool.query(
        'SELECT * FROM biodata WHERE id = $1',
        [req.params.id]
    )

    if (result.rowCount === 0) {
        return errorResponse(res, 'Data tidak ditemukan', 404)
    }

    return successResponse(res, 'Data berhasil diambil', result.rows[0])
})

app.post('/biodata', validateBody(biodataSchema), async (req, res) => {
    const { id, nama, nim, kelas } = req.body
    const columns = ['nama', 'nim', 'kelas']
    const values = [nama, nim, kelas]

    if (id !== undefined) {
        columns.unshift('id')
        values.unshift(id)
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
    const result = await req.pool.query(
        `INSERT INTO biodata (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
    )

    return successResponse(res, 'Data berhasil ditambahkan', result.rows[0], 201)
})

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
