const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

require('dotenv').config();
const CODE = process.env.JSON_KEY;

var express = require('express');
const adminController = require('../controllers/adminController');
const managerController = require('../controllers/managerController');
const userController = require('../controllers/userController');


const authAdmin = require('../middlewares/authAdmin');
const authManager = require('../middlewares/authManager');
const authUser = require('../middlewares/authUser');

var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const userToken = req.cookies.userToken;

  if (userToken === undefined) {
    try {
      res.render('index', { userActive: false, });
    } catch (error) {
      console.error(error);
    }
  } else {
    try {
      const user = jwt.verify(userToken, CODE);
      const pk = parseInt(user.userId);

      const users = await prisma.User.findFirst({
        where: { id: pk }
      });
  
      res.render('index', { data: users, userActive: true, });
    } catch (error) {
      console.error(error);
    }
  }
});

// Assuming you have a route file or in your main app file
router.get('/search-turf', async (req, res) => {
  const { place } = req.query;
  const today = new Date().toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD

  try {
      const turfs = await prisma.Turf.findMany({
          where: {
              place: { contains: place, mode: 'insensitive' },
              updatedAt: {
                  gte: new Date(today + "T00:00:00.000Z"),
                  lt: new Date(today + "T23:59:59.999Z")
              }
          },
          include: {
              turfSchedules: {
                  where: {
                      isPaid: false,
                      createdAt: {
                          gte: new Date(today + "T00:00:00.000Z"),
                          lt: new Date(today + "T23:59:59.999Z")
                      }
                  }
              }
          }
      });
      res.json(turfs);
  } catch (error) {
      console.error("Error fetching turf data:", error);
      res.status(500).json({ error: "Server error" });
  }
});


// Order page
router.get('/bookschedule/:turfId/:schedule/:userId', async (req, res) => {
  // Parse each parameter individually
  const turfId = parseInt(req.params.turfId);
  const scheduleId = parseInt(req.params.schedule);
  const userId = parseInt(req.params.userId);

  try {
    // Fetch turf details by turfId
    const turf = await prisma.Turf.findUnique({
      where: { id: turfId }
    });

    if (!turf) {
      return res.status(404).send("Turf not found");
    }

    // Fetch manager details associated with the turf
    const manager = await prisma.Manager.findUnique({
      where: { id: turf.managerId } // No need to parse `turf.managerId` if it's already an integer
    });

    if (!manager) {
      return res.status(404).send("Manager not found");
    }

    // Fetch user details by userId
    const user = await prisma.User.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch the specific schedule by schedule ID
    const schedule = await prisma.TurfSchedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    // Render the booking page with all necessary details
    res.render('bookingPage', {
      turf,
      manager,
      user,
      schedule
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).send("Error loading booking page");
  }
});

router.post('/order/:userId/:managerId/:turfId/:scheduleId', async (req, res) => {
  try {
    const { name, cardno, cvv, expiryDate, amount } = req.body;
    const userId = parseInt(req.params.userId);
    const turfId = parseInt(req.params.turfId);
    const scheduleId = parseInt(req.params.scheduleId);
    const managerId = parseInt(req.params.managerId);

    // card no: 1442 4214 1442 4214

    const ordered = await prisma.Order.create({
      data: {
        cardName: name,
        cardno: cardno,
        userId: userId,
        turfId: turfId,
        turfScheduleId: scheduleId,
      }
    });
    console.log('Ordered is completed added.');

    const updateSchedule = await prisma.TurfSchedule.update({
      where: { id: scheduleId },
      data: {
        isPaid: true
      }
    });
    console.log('Turf schedule is completed updated.');

    res.redirect('/user/dashboard');
    

  } catch (error) {
    console.error(error);
  }
});


// admin
router.get('/admin/logout', adminController.adminLogout);
router.get('/admin/login', adminController.adminLogin);
router.get('/admin/index',authAdmin, adminController.home);

router.post('/admin/login', adminController.adminLoginProcess);


// manager
router.get('/manager/', managerController.managerLogin);
router.get('/manager/logout', managerController.managerLogout);
router.get('/manager/register', managerController.managerReg);
router.get('/manager/index', authManager, managerController.home);
router.get('/manager/addTurf', authManager, managerController.addTurf);
router.get('/manager/addSchedule/:id', authManager, managerController.addSchedule);
router.get('/manager/payment', authManager, managerController.payment);

router.post('/manager/register', managerController.managerRegData);
router.post('/manager/login', managerController.managerLoginProcess);
router.post('/manager/addTurf/:mId', managerController.addNewTurf);
router.post('/manager/addSchedule/:id', managerController.addScheduleTime);

// user
router.get('/user/login', userController.login);
router.get('/user/logout', userController.userLogout);
router.get('/user/register', userController.register);
router.get('/user/dashboard', authUser, userController.dashboard);

router.post('/user/register', userController.registerUserData);
router.post('/user/login', userController.userLoginProcess);



module.exports = router;