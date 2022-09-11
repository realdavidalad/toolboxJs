module.exports = {
    solutionName: "Just.com",
    BaseUrl: "http://localhost:4040",
    puppeteertoPrintPath:"",
    solutionFunctionalEmail: "hello@test.com",
    accessTokenExpireIn:"1h",
    otpExpirationMinutes:5,
    loginWith:{
        password:1,
        pin:2
    },
    sendLiveMail: false,
    smtpConnectionInfo: {
        test: {
            host: "smtp.mailtrap.io",
            port: 2525,
            username: "b3bc835ae",
            password: "fdf958f76e"
        },
        live: {
            host: "mail.test.com",
            port: 26,
            username: "n-reply@test.com",
            password: "Pa55wo0rd12*"
        }
    }




}