const jwt = require("jsonwebtoken");
const fs = require('fs').promises;
var calendar = require('calendar-month-array');
const nodemailer = require("nodemailer");
const puppeteer = require('puppeteer');
const config = require("../../config")
//below are library passed inline. do not uncomment here
// var parser = require('simple-excel-to-json')
// const csv = require('csvtojson');
// const ObjectsToCsv = require('objects-to-csv');

//other libraries



//resposify
const responsify = (res, code, message = null, results = {}) => {
  //body=(code.toString().search("20")<0)?{results:body}:{results:body};
  //results={access_token:"1", results:results};

  //encrypt resuts to implement in-transit end-to-end encryption(E2EE)
  // results= btoa(JSON.stringify(results));


  if (results) {
    //To enable Postman api client read access_token from this http response
    res.status(code).send({ code, msg: message, data: results, access_token: results.access_token })
  } else {
    res.status(code).send({ code, msg: message, data: results });
  }
}

// not working
//Generate and return jwt access_token of specified user
const generateJwtAccessToken = async (res, user, expiresIn) => {

  let toReturn = {};

  jwt.sign({ user }, "MyCustomEncryptionSecretKey_QUIAUQTQAJAJTGJqjqkqjshyqsnnskqlUYQIAJAKMqyqthYQHOQUJATJSJQOSy62jsjsjjUHHQTAG", { expiresIn }, (err, token) => {
    if (err) {
      //responsify(res, 500, err);
      return err

    } else {
      //return {access_token:token, expiresIn:expiresIn};
      // responsify(res, 200, "", { access_token: token });
      console.log("1111")
      toReturn["access_token"] = token;
      toReturn["expiresIn"] = expiresIn;
      console.log(toReturn.access_token)

    }
  });

  setTimeout(() => {
    console.log(toReturn)
    return toReturn;
  }, 5000)


}


//get authenticated user object
const getJwtCurentUser = async (req) => {
  try{
  //Perform header-level verification first.
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // decode user access token to user object using your jwt encoding secret key;
    return (jwt.decode(bearer[1], "MyCustomEncryptionSecretKey_QUIAUQTQAJAJTGJqjqkqjshyqsnnskqlUYQIAJAKMqyqthYQHOQUJATJSJQOSy62jsjsjjUHHQTAG")).user;
  } else {
    // Forbidden
    throw {message:"Invalid access token/access token supplied", code:401}
  }
}catch(err){
  throw {msg:err.message, code:err.code?err.code:501}
}

}



const reqHasToken = (req) => {
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader == 'undefined') {
    return false;
  } else {
    if (bearerHeader == null || bearerHeader == "") {
      return false;
    } else {
      return true;
    }
  }
}


// Verify jwt access_token
const jwtAuthorize = () => {
  return async (req, res, next) => {
  //Perform header-level verification first.
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;

    //Now do jwt-level verification for the access token to check if it exist in session.
    jwt.verify(req.token, 'MyCustomEncryptionSecretKey_QUIAUQTQAJAJTGJqjqkqjshyqsnnskqlUYQIAJAKMqyqthYQHOQUJATJSJQOSy62jsjsjjUHHQTAG', (err, authData) => {
      if (err) {
        responsify(res, 401, err, null);
      } else {

        //next middleware
        next();
      }
    });


  } else {
    // Forbidden
    responsify(res, 401, "Unauthorized request.", null);
  }
  }
}


const jwtAuthorizeRoles = (roles) => {
  return async (req, res, next) => {
    try {
      //Perform header-level verification first.
      // Get auth header value
      const bearerHeader = req.headers['authorization'];
      // Check if bearer is undefined
      if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;

        //Now do jwt-level verification for the access token to check if it exist in session.
        jwt.verify(req.token, 'MyCustomEncryptionSecretKey_QUIAUQTQAJAJTGJqjqkqjshyqsnnskqlUYQIAJAKMqyqthYQHOQUJATJSJQOSy62jsjsjjUHHQTAG', (err, authData) => {
          if (err) {
            responsify(res, 401, err, null);
          } else {
            if (roles) {
              //extract role and username form access_token object
              const tokenObject = jwt.decode(bearer[1], "MyCustomEncryptionSecretKey_QUIAUQTQAJAJTGJqjqkqjshyqsnnskqlUYQIAJAKMqyqthYQHOQUJATJSJQOSy62jsjsjjUHHQTAG");
              const userRole = tokenObject.user.role || tokenObject.role;
              if (roles.includes(userRole)) {
                //next middleware
                next()
              } else {
                responsify(res, 403, "Access Deniel! Your role is not allowed to access this resource.", null);
              }
            } else {
              next();
            }
          }
        });

      } else {
        // Forbidden
        responsify(res, 401, "Unauthorized request.", null);
      }
    }
    catch (error) {
      responsify(res, 401, "Unauthorized request.", error);
    }
  }
}



//log error in a file and complete current request with http response
const FaskErrorHandler = (res, err) => {
  //log error in a file
  //complete current http response
  responsify(res, 500, err, "System encounterred error. Please try engaing later.", null);
}

const capitalizeFirstletter = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const removeUnderScoreFromText = (text) => {
  let newTextArr = text.split("_");
  newTextArr.map((item, index) => {
    newTextArr[index] = capitalizeFirstletter(item);
  })
  const capitalizedText = newTextArr.join(" ");
  return capitalizedText.trim();
}



//other utilities
const paginateArray = async (data, page, pageSize = 10) => {
  let currentPage = Number(page), pages = 0, total = 0;
  pageSize = Number(pageSize);
  total = data.length;
  pages = (pageSize > total) ? 1 : Math.round(total / pageSize)
  let sliceFrom = (currentPage == 0) ? 0 : currentPage * pageSize - pageSize;
  let sliceTo = sliceFrom + pageSize;
  const nextPage = (currentPage == pages) ? currentPage : currentPage + 1;
  let result = { data: await data.slice(sliceFrom, sliceTo + 1), metaData: { currentPage: page, nextPage, pages, total } }
  return result;
}


//file system

const uploadBase64File = async (pathWithName, base64String) => {
  try {
    let base64File = base64String.split(';base64,').pop();
    await fs.writeFile(pathWithName, base64File, { encoding: 'base64' });
    return { uploaded: true, err: null }
  } catch (err) {
    return { uploaded: false, err: err }
  }
}

const saveStringToFile = async (pathWithName, theString) => {
  try {
    await fs.writeFile(pathWithName, theString);
    return { saved: true, err: null }
  } catch (err) {
    return { saved: false, err: err }
  }
}

const readStringFromFile = async (pathWithName) => {
  const data = await fs.readFile(pathWithName, 'utf8');
  return data;
}

//file processing

const convertExcelAndCvsToJson = async (filePath, extension) => {

  try {
    let jsonResult = [];
    if (extension == "xls" || extension == "xlsx") {
      //is excel
      var parser = require('simple-excel-to-json')
      var result = parser.parseXls2Json(filePath);
      jsonResult = result[0];
    } else {
      //is csv
      const csv = require('csvtojson');
      const result = await csv().fromFile(filePath);
      jsonResult = result
    }

    return { converted: true, jsonResult: jsonResult, err: "" }

  } catch (err) {

    return { converted: false, jsonResult: [], err: err }
  }
}

const convertJsonToCsv = async (savePath, data) => {
  const fileName = savePath;
  const ObjectsToCsv = require('objects-to-csv');
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(fileName);
  // Return the CSV file as string:
  return fileName;
}



//string manipulation

const replaceAll = async (text, toReplace, replaceBy) => {
  const newText = text.split(toReplace).join(replaceBy);
  return newText
}

const sanitize = async (toSanitize)=>{
  return toSanitize.toString().replace(/[^a-zA-Z0-9]/g, '')
}

const isNullOrEmpty = (str) => {
  return (!str || 0 === str.length);
}

const generateRandomString = async (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const generateRandomNumber = async (length) => {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const randomNumber = Number(result);
  return randomNumber;
}


const generateRandomNumberString = async (length) => {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  const randomNumber = result;
  return randomNumber;
}


//date manipiulation

const prependDigitWithZero = async (number, numberOfZeros, z) => {
  z = z || '0';
  number = number + '';
  return number.length >= numberOfZeros ? numberOfZeros : new Array(numberOfZeros - number.length + 1).join(z) + number;
}

const stripISOTimestampWithUnderscore = async (ISOTimeStampString) => {
  let todayDate = ISOTimeStampString;
  todayDate = await replaceAll(todayDate, " ", "_"); todayDate = await replaceAll(todayDate, ".", "_"); todayDate = await replaceAll(todayDate, ":", "_"); todayDate = await replaceAll(todayDate, "+", "_"); todayDate = await replaceAll(todayDate, "-", "_"); todayDate = await replaceAll(todayDate, "T", "_");
  return todayDate;
}

const getDateObject = async (timestamp) => {
  const timestampInt = Date.parse(timestamp);
  var date = new Date(timestampInt)
  var day = date.getDate();
  var month = date.getMonth() + 1; //Be careful! January is 0 not 1 for date.getMonth() response.
  var year = date.getFullYear();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  const result = { day, month, year, hour, minute, second }
  return result;
}

const etractDateOnlyStringFromTimestamp = async (timestamp) => {
  date = new Date(timestamp);
  year = date.getFullYear();
  month = date.getMonth() + 1;
  dt = date.getDate();

  if (dt < 10) {
    dt = '0' + dt;
  }
  if (month < 10) {
    month = '0' + month;
  }
  const dateOnly = year + '-' + month + '-' + dt;
  return dateOnly;
}


const extractIsoTimeFromTimeStamp = async (timestamp) => {
  let ISOTime = null;
  if (timestamp.length <= 8) {
    //is just time
    ISOTime = timestamp;
  } else {
    //is timestamp
    const dateObject = await getDateObject(timestamp);
    let h = await prependDigitWithZero(dateObject.hour, 2);
    let m = await prependDigitWithZero(dateObject.minute, 2);
    let s = await prependDigitWithZero(dateObject.second, 2);
    ISOTime = `${h}:${m}:${s}`;

  }
  return ISOTime;
}

const addDaysToDate = async (days, date) => {
  const daysToMilliSecs = Number(days) * 24 * 60 * 60 * 1000;
  const newDate = new Date(new Date(date) + daysToMilliSecs);
  return newDate;
}

const getMonthLength = async (month, year) => {
  return new Date(year, month, 0).getDate();
}


//mailing
//database mail

const sendSQLSMTPMail = async (paramObject, dbMailConnectionInfo, isLiveEmail = true) => {
  try {

    const Sequelize = require('sequelize');
    const env = process.env.NODE_ENV || 'development';
    const config = require(`C:\\inetpub\\wwwroot\\office_booking_api\\server\\config\\config.json`)[env];


    let sequelize;
    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable]);
    } else {
      sequelize = new Sequelize(
        config.database, config.username, config.password, config
      );
    }

    const mssqlStorePrecedureExecuteQuery = 'EXEC spSendMail @mailTo=:mailTo, @mailCC=:mailCC, @mailBCC=:mailBCC, @mailSubject=:mailSubject, @mailbody=:mailbody, @profileName=:profileName';
    const result = await sequelize
      .query(mssqlStorePrecedureExecuteQuery,
        {
          replacements:
          {
            mailTo: paramObject.to,
            mailCC: (paramObject.cc) ? paramObject.cc : "",
            mailBCC: (paramObject.cc) ? paramObject.bcc : "",
            mailSubject: (paramObject.subject) ? paramObject.subject : "",
            mailbody: (paramObject.textBody) ? paramObject.textBody : "",
            profileName: dbMailConnectionInfo.dbmailProfileName,
          }
        });
    console.log(result)
    return result;
  } catch (err) {
    console.log(err);
    return "failed with: " + err;
  }
}

//direct smtp client from code
const sendSMTPMail = async (emailObject, smtpConnectionInfo, isLiveEmail = true) => {
  
 let connectionInfo = {
    host: smtpConnectionInfo.host,
    port: smtpConnectionInfo.port,
    secure: false, // true for 465, false for other ports
    //requireTLS:true, //new addition.
    auth: {
      user: smtpConnectionInfo.username, // 
      pass: smtpConnectionInfo.password, // 
    }
  }

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(connectionInfo);

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: emailObject.from, // sender address
    to: emailObject.to, // list of receivers
    subject: emailObject.subject, // Subject line
    text: emailObject.textBody, // plain text body
    html: emailObject.htmlBody, // html body
  });

  // console.log(info);
  return info
}
//dbmail

const JoinExpressValidatorMessages = async (messages) => {
  let joinedMessage = null;
  for (let index = 0; index < messages.length; index++) {
    const element = messages[index];
    switch (index) {
      case 0:
        joinedMessage = element.msg;
        break;
      default:
        joinedMessage = joinedMessage + " " + element.msg;
        break;
    }
  }

  return joinedMessage;
}

const getDateBasedCalenderForMonth = async (aDateInMonth) => {
  var weeks = calendar(new Date(aDateInMonth))
  return weeks;
}

const addDaysToDate2 = async (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


const arrayToNumber = async (stringArray) => {
  let numberArray = []
  for (let index = 0; index < stringArray.length; index++) {
    const element = Number(stringArray[index]);
    numberArray[index] = element;
  }
  return numberArray;
}


//Pdf builders
//html to pdf - using puppeter

const convertHtmlToPdf = async (data, htmlString) => {

  try {
    //generate dynamic html
    let newHtmlString = htmlString;

    for (key in data) {
      newHtmlString = await replaceAll(newHtmlString, key, data[key]);
    }

    //save the new htm string
    const randomString = await generateRandomString(20);
    const fileName = "./public/to_print/" + randomString + ".html";
    const status = await saveStringToFile(fileName, newHtmlString);

    //print to pdf using puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    //const toPrintUrl ="./public/to_print/" + randomString + ".html"
    const toPrintUrl= config.puppeteertoPrintPath+"/"+randomString+".html"
    await page.goto(toPrintUrl, { waitUntil: 'networkidle2' });
    await page.pdf({ path: `./public/to_print/${randomString}.pdf`, format: 'A4' });

    await browser.close();

    const pdfUrl = `${config.BaseUrl}/public/to_print/${randomString}.pdf`;

    return pdfUrl;
  } catch (err) {
    console.log(err);
    return { converted: false, err: err }
  }
}



//export list 
module.exports = {
  //API response standadization
  responsify,
  //authentication and authorization
  jwtAuthorize,
  jwtAuthorizeRoles,
  // generateJwtAccessToken,
  getJwtCurentUser,
  reqHasToken,
  //data pagination
  paginateArray,
  //file processing
  uploadBase64File,
  saveStringToFile,
  readStringFromFile,
  //string manipulation
  sanitize,
  removeUnderScoreFromText,
  replaceAll,
  //random generators
  generateRandomString,
  generateRandomNumber,
  //data extraction from files
  convertExcelAndCvsToJson,
  convertJsonToCsv,
  convertHtmlToPdf,
  //emailing
  sendSMTPMail,
  sendSQLSMTPMail,
  //date manipulation
  getDateObject,
  addDaysToDate,
  getMonthLength,
  getDateBasedCalenderForMonth,
  addDaysToDate2,
  stripISOTimestampWithUnderscore,
  extractIsoTimeFromTimeStamp,
  etractDateOnlyStringFromTimestamp,
  prependDigitWithZero,
  //variable and collection casting
  arrayToNumber,
  //other
  isNullOrEmpty,
  JoinExpressValidatorMessages,
  generateRandomNumberString
};