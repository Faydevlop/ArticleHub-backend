const jwt = require('jsonwebtoken')

const authenticateJWT = (req,res,next)=>{
    const token = req.header('Authorization')?.split(' ')[1];

    if(!token){
        return res.status(403).json({message:'Authorization token is missing'})
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }


}

module.exports = authenticateJWT;