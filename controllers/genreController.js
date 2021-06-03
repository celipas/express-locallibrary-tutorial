var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function(err, list_genre) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_genre,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        var err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render('genre_detail', {
        title: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create POST.
exports.genre_create_post = [
  // Validate and santize the name field.
  body('name')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('Genre name must contain at least 3 characters')
    .isLength({ max: 100 })
    .withMessage('Genre name must be less than 100 characters'),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const { formatter, errors } = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre({ name: req.body.name });

    if (errors.length !== 0) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors,
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec(function(err, found_genre) {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(302, found_genre.url);
        } else {
          genre.save(function(err) {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form GET .
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre: callback => {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books: callback => {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results
        res.redirect('/catalog/genres');
      }
      // Successful so render!
      res.render('genre_delete', {
        title: 'Genre Delete',
        genre: results.genre,
        genres_books: results.genres_books,
      });
    }
  );
};

// Handle Genre delete POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre: callback => {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books: callback => {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success.
      if (results.genres_books.length > 0) {
        // Genre has books. Render in the same way as for GET route.
        res.render('genre_delete', {
          title: 'Genre Delete',
          genre: results.genre,
          genres_books: results.genres_books,
        });
        return;
      } else {
        // Genre has no books. Delete object and redirect to the list of genres
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          //
          res.redirect('/catalog/genres');
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  // Get genre instance
  async.parallel(
    {
      genre: callback => {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No genre results
        var err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected genre
      res.render('genre_form', {
        title: 'Update Genre',
        genre: results.genre,
      });
    }
  );
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and santize
  body('name')
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage('Genre name must contain at least 3 characters')
    .isLength({ max: 100 })
    .withMessage('Genre name must be less than 100 characters'),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escapted, trimmed data and old id.
    var genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors; render form again with sanitized values/error messages.

      // Get all authors
      return;
    } else {
      // Data from form
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) {
          return next(err);
        }
        // sucessful - redirect to the genre detail page.
        res.redirect(thegenre.url);
      });
    }
  },
];
