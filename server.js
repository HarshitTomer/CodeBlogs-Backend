const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs')
const path = require('path')
// const devcert = require('devcert')
require('dotenv').config();
// bring routes
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const tagRoutes = require('./routes/tag');
const formRoutes = require('./routes/form')
const https = require('https')
// app
const app = express();

// db
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("DB Connected"))

mongoose.connection.on("error", err => {
    console.log(`DB connection error: ${err.message}`);
});

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json({limit: '50mb'}))

app.use(cookieParser());
// cors
// if (process.env.NODE_ENV == 'development') {
//     app.use(cors({ origin: `${process.env.CLIENT_URL}` }));
// }
app.use(cors())
// routes middleware
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);
app.use('/api', formRoutes)
// app.use(express.static('public')); 
app.use('/public', express.static('public'));
// port
// let ssl = devcert.certificateFor('my-app.test');
// https.createServer(ssl, app).listen(8000);
const sslServer = https.createServer({
    key:fs.readFileSync(path.join(__dirname,'key','private.pem')),
    cert:fs.readFileSync(path.join(__dirname,'key','certificate.pem'))
}, app)


const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});