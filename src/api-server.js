import express from 'express'
import bodyParser from 'body-parser'
import Sequelize from 'sequelize'
const Op = Sequelize.Op // Bad trick

/*
import * as sq from 'sequelize'
let Op = sq.Op
*/

// import sequelize connector and User and Message models instances
import { sequelize, User, Message } from './models/db.js'

// Test if database connection is OK else exit
try {
    await sequelize.authenticate() // try to authentificate on the database
    console.log('Connection has been established successfully.')
    await User.sync({ alter: true }) // modify users table schema is something changed
    await Message.sync({ alter: true }) // same for messages table
} catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
}

// Local network configuration
const IP = '192.168.0.11'
const PORT = 7777

const app = express()

// A middle for checking if an api key is provided by the user
// in the Authorization header
const getApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    if (!key) {
        res.status(403).json({ code: 403, data: 'No api token' })
    } else {
        next()
    }
}

// A middleware for checking if an api token is valid
// and is still active.
const validateApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            where: { api_key: key },
        })
        // check if empty results then not found
        if (user.length === 0) {
            res.status(403).json({ code: 403, data: 'Invalid api token' })
        } else if (!user[0].active) {
            res.status(403).json({
                code: 403,
                data: 'You are in our blacklist, adios',
            })
        } else {
            next()
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

// A middleware for getting user information based on api_key
// the user's information will be attached to the req object
const getUserByApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'username', 'email', 'api_key'],
            where: { api_key: key },
        })
        req.user = user[0]
        next()
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: false })) // to support URL-encoded bodies

/*
Endpoint for user registration. 
input:
{
    "username": string,
    "email": string
}
*/
app.post('/register', async (req, res) => {
    //check username n'et pas null, pareil pour email
    const username = req.body.username
    const email = req.body.email
    try {
        const user = await User.create({ username: username, email: email })
        res.json({ code: 200, data: user })
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

app.use(getApiKey)
app.use(validateApiKey)
app.use(getUserByApiKey)

// GET user by id
app.get('/id/:id', async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { id: id },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: e })
    }
})

// GET user by username
app.get('/username/:username', async (req, res) => {
    const username = req.params.username
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { username: username },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET user by email
app.get('/email/:email', async (req, res) => {
    const email = req.params.email
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { email: email },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username', 'email', 'id'],
        })
        if (users.length === 0) {
            res.status(404).json({ code: 404, data: 'users not found' })
        } else {
            res.json({ code: 200, data: users })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// See comments at end of file for an old version
app.get('/blacklist/:id', async (req, res) => {
    if (req.user.id !== 1) {
        res.status(403).json({ code: 403, data: 'Not allowed' })
    } else {
        try {
            const id = req.params.id
            await User.update({ active: false }, { where: { id: id } })
            res.status(200).send({ code: 200, data: 'User blacklisted' })
        } catch (e) {
            res.status(500).json({ code: 500, data: 'Internal server error' })
        }
    }
})

app.get('/whitelist/:id', async (req, res) => {
    if (req.user.id !== 1) {
        res.status(403).json({ code: 403, data: 'Not allowed' })
    } else {
        try {
            const id = req.params.id
            await User.update({ active: true }, { where: { id: id } })
            res.status(200).send({ code: 200, data: 'User whitelisted' })
        } catch (e) {
            res.status(500).json({ code: 500, data: 'Internal server error' })
        }
    }
})

//Send a message to a suer
app.post('/send', async (req, res) => {
    const src = req.user.id
    const dst = req.body.dst
    const content = req.body.content
    try {
        const message = await Message.create({
            src: src,
            dst: dst,
            content: content,
        })
        res.status(200).json({ code: 200, data: message })
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

app.get('/read', async (req, res) => {
    try {
        const user_id = req.user.id
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    {
                        src: {
                            [Op.eq]: user_id,
                        },
                    },
                    {
                        dst: {
                            [Op.eq]: user_id,
                        },
                    },
                ],
            },
            order: [['updatedAt', 'desc']],
        })
        res.status(200).json({ code: 200, data: messages })
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error.' })
    }
})

//BEFORE Exercice 7
/*
app.get('/blacklist/:id', async (req, res) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'username', 'email', 'api_key'],
            where: { api_key: key },
        })
        if (user[0].id === 1) {
            const id = req.params.id
            await User.update({ active: false }, { where: { id: id } })
            res.status(200).send({ code: 200, data: 'User blacklisted' })
        } else {
            res.status(403).send({ code: 403, data: 'Not allowed' })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: e })
    }
})
*/

// Start express server
app.listen(PORT, IP, () => {
    console.log(`listening on ${IP}:${PORT}`)
})
