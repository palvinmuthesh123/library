var express = require('express');
const bodyParser = require('body-parser');
const acceptRouter = express.Router();
const mongoose = require('mongoose');

var Accept = require('../../models/accepts');
var Books = require('../../models/books');
var Users = require('../../models/users');

var passport = require('passport');
var authenticate = require('../../authenticate');

const cors = require('../cors');

acceptRouter.use(bodyParser.json());

acceptRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser
        , authenticate.verifyAdmin,
        function (req, res, next) {
            Accept.find({})
                .populate('student')
                .populate('book')
                .then((accepts) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(accepts);
                }, (err) => (next(err)))
                .catch((err) => (next(err)))
        }
    )

    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Books.findById(req.body.book)
            .then((requiredBook) => {
                Users.findById(req.body.student)
                    .then((requiredUser) => {

                        if (!requiredBook) {

                            err = new Error("Book doesn't exist");
                            err.status = 400;
                            return next(err);
                        }
                        else if (!requiredUser) {
                            err = new Error("Student doesn't exist");
                            err.status = 400;
                            return next(err);
                        }
                        else if (requiredBook._id && requiredUser._id) {
                            Accept.find({
                                student: req.body.student
                            })
                                .then((accepts) => {
                                    notAccepted = accepts.filter((accept) => (!accept.accepted));
                                    if (notAccepted && notAccepted.length >= 3) {
                                        err = new Error(`The student has already accept 3 books. Please accept them first`);
                                        err.status = 400;
                                        return next(err);
                                    }
                                    else {
                                        if (requiredBook.copies > 0) {
                                            Accept.create(req.body, function (err, accept) {
                                                if (err) return next(err)
                                                Accept.findById(accept._id)
                                                    .populate('student')
                                                    .populate('book')
                                                    .exec(function (err, accept) {
                                                        if (err) return next(err)
                                                        Books.findByIdAndUpdate(req.body.book, {
                                                            $set: { copies: (requiredBook.copies - 1) }
                                                        }, { new: true })
                                                            .then((book) => {
                                                                res.statusCode = 200;
                                                                res.setHeader('Content-Type', 'application/json');
                                                                res.json(accept);

                                                            }, (err) => next(err))
                                                            .catch((err) => res.status(400).json({ success: false }));

                                                    })
                                            })
                                        }
                                        else {
                                            console.log(requiredBook);
                                            err = new Error(`The book is not available. You can wait for some days, until the book is accepted to library.`);
                                            err.status = 400;
                                            return next(err);
                                        }
                                    }
                                })
                                .catch((err) => (next(err)));
                        }

                    }, (err) => (next(err)))
                    .catch((err) => (next(err)))

            }, (err) => (next(err)))
            .catch((err) => (next(err)))

    })

    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /accepts');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        //res.statusCode = 403;
        //res.end('DELETE operation not supported on /accepts');

        Accept.remove({})
            .then((resp) => {
                console.log("Removed All Accept");
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));

    })
acceptRouter.route('/student/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        console.log("\n\n\n Object ID =====" + req.user._id);
        Accept.find({ student: req.user._id })
            .populate('student')
            .populate('book')
            .then((accept) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(accept);
            }, (err) => (next(err)))
            .catch((err) => (next(err)))
    })

acceptRouter.route('/:acceptId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Accept.findById(req.params.acceptId)
            .populate('student')
            .populate('book')
            .then((accept) => {
                if (accept && (accept.student._id === req.user._id || req.user.admin)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(accept);
                }
                else if (!accept) {
                    err = new Error(`Accept not found`);
                    err.status = 404;
                    return next(err);
                }
                else {
                    err = new Error(`Unauthorised`);
                    err.status = 401;
                    return next(err);
                }
            }, (err) => (next(err)))
            .catch((err) => (next(err)))
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /accepts/' + req.params.acceptId);
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /accepts/' + req.params.acceptId);
    })

    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Accept.findById(req.params.acceptId)
            .then((accept) => {
                Books.findById(accept.book)
                    .then((requiredBook) => {
                        Accept.findByIdAndUpdate(req.params.acceptId, {
                            $set: { accepted: true }}, { new: true })
                            .populate('student')
                            .populate('book')
                            .then((accept) => {
                                Books.findByIdAndUpdate(accept.book, {
                                    $set: { copies: (requiredBook.copies + 1) }
                                }, { new: true })
                                    .then((book) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(accept);
                                    }, (err) => next(err))
                                    .catch((err) => res.status(400).json({ success: false, message: "Book not updated" }));
                                }, (err) => next(err))
                            .catch((err) => res.status(400).json({ success: false, message: "Accept not Updated" }));

                    }, (err) => next(err))
                    .catch((err) => res.status(400).json({ success: false, message: "Book not found" }));

            }, (err) => next(err))
            .catch((err) => res.status(400).json({ success: false, message: "Accept not found" }))
    })


module.exports = acceptRouter;