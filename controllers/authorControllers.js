var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');
const author = require('../models/author');

// Display list of all Authors.
exports.author_list = (req, res, next) => {
  Author.find({
    // death: { $exists: true },
  })
    .sort([['family_name', 'ascending']])
    .exec(function(err, list_authors) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

// Display detil page for a specific Author.
exports.author_detail = (req, res, next) => {
  async.parallel(
    {
      author: callback => {
        Author.findById(req.params.id).exec(callback);
      },
      author_books: callback => {
        Book.find({ author: req.params.id }, { title: 1, summary: 1 }).exec(
          callback
        );
      },
    },
    function(err, results) {
      if (err) {
        return next(err);
      } //Handles Error in API usage
      if (results == null) {
        // no result but the call doesn't error
        var err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render('author_detail', {
        title: 'Author Detail',
        author: results.author,
        author_books: results.author_books,
      });
    }
  );
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};
// Handle Author create on POST.
exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters.')
    .isAlphanumeric()
    .withMessage('Last name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isLength({ max: 100 })
    .withMessage('Family name must be less than 100 characters.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid date of birth.'),
  body('date_of_death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid date of death.'),
  (req, res, next) => {
    const { formatter, errors } = validationResult(req);

    if (errors.length !== 0) {
      res.render('author_form', {
        title: 'Author Form',
        author: req.body,
        errors: errors,
      });
      return;
    } else {
      // Data from form is valid.
      // Create an Author object with escaped and trimmed data.
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(err => {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new
        // author record.
        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = (req, res, next) => {
  //
  async.parallel(
    {
      author: function(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results.
        res.redirect('/catalog/authors');
      }
      // Successful so render!
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// // Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {
  async.parallel(
    {
      author: function(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      // Success.
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list.
          res.redirect('/catalog/authors');
        });
      }
    }
  );
};
// Display Author update form on GET.
exports.author_update_get = (req, res, next) => {
  // Get author and authors books
  async.parallel(
    {
      author: callback => {
        Author.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results
        var err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }
      // Success
      // Render Book Form

      // Converting dates to formated strings
      var string_birth_date;
      if (results.author.date_of_birth) {
        string_birth_date = results.author.date_of_birth
          .toISOString(0, 19)
          .substring(0, 10);
      }
      var string_death_date;
      if (results.author.date_of_death) {
        string_death_date = results.author.date_of_death
          .toISOString(0, 19)
          .substring(0, 10);
      }
      res.render('author_form', {
        title: 'Update Author',
        author: results.author,
        birth_date: string_birth_date,
        death_date: string_death_date,
      });
    }
  );
};
// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitise fields.
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters.')
    .isAlphanumeric()
    .withMessage('Last name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isLength({ max: 100 })
    .withMessage('Family name must be less than 100 characters.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid date of birth.'),
  body('date_of_death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid date of death.'),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // extract validation errors
    const errors = validationResult(req);
    // Create a Author object with escaped/trimmed data and old id.
    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres from form.
      return;
    } else {
      // Data from form.
      Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
        if (err) {
          return next(err);
        }
        // sucessful - redirect to the genre detail page.
        res.redirect(theauthor.url);
      });
    }
  },
];
