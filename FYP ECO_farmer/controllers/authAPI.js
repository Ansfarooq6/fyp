exports.gettlogin = async (req  , res , next) =>{
    try {
        return res.status(200).json({
            message : "Login Successfull"
        })
    }
    catch (error) {
        next(error)
        }

}