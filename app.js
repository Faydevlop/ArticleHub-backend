const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000
const { default: mongoose } = require('mongoose')
require('dotenv').config();


app.use(cors())
app.use(express.json())


mongoose.connect(process.env.MONGO_URI, {

    connectTimeoutMS: 30000, // 30 seconds
})
.then(() => {
    console.log('MongoDB connected successfully');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});

// routes 
const userRoute = require('./routes/userRoutes')

app.use('/user',userRoute)


app.get('/',(req,res)=>{
    res.send('server is running')
    
})

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})