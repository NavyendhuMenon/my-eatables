import  mongoose from "mongoose" 
mongoose.connect("mongodb://127.0.0.1:27017/Eatable", { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));


import express from "express"
const app = express();
import userRoute from "./routes/userRoute.js"
import adminRoute from "./routes/adminRoute.js"
import nocache from "nocache"
app.use(nocache())

import passport from './helper/passportHelper.js';
app.use(passport.initialize());


//for user routes
app.use(express.static('public'))

app.use('/',userRoute)
app.use('/admin', adminRoute)

const PORT= 3000
app.listen(PORT,()=>{
    console.log("Server started on http://localhost:3000");
})
