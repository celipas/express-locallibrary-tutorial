var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find({})
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};
// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Sucessful, so render
      res.render('bookinstance_detail', {
        title: `Copy: `,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  //  Get all books to create more instances.
  Book.find({}, { title: 1 }).exec((err, books) => {
    if (err) {
      return next(err);
    }
    let temp_status_list = ['Available', 'Maintenance', 'Loaned', 'Reserved'];
    // You are sucessful, and a unique snow flake, so render
    res.render('bookinstance_form', {
      title: 'Create Book Instance',
      book_list: books,
      status_list: temp_status_list,
    });
  });
};
// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  //  validate and sanitise fields.
  body('book', 'Book must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('imprint', 'Imprint must be specified'),
  body('status').escape(),
  body('due_back', 'Invalid date'),

  (req, res, next) => {
    const { formatter, errors } = validationResult(req);

    if (errors.length !== 0) {
      res.render('bookinstance_form', {
        title: 'Create Book Instance',
        book_list: books,
        errors: errors,
      });
      return;
    } else {
      // Dats fro form is valid.
      // Create a Book Instance object with escaped and trimmed data.
      var bookInstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      });
      bookInstance.save(err => {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new book instance record,
        res.redirect(bookInstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  async.parallel(
    {
      bookInstance: callback => {
        BookInstance.findById(req.params.id)
          .populate('book')
          .exec(callback);
      },
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookInstance == null) {
        // No results.
        res.redirect('/catalog/bookinstances');
      }
      // Successful so render!
      res.render('bookinstance_delete', {
        _id: 1,
        title: 'Delete Book Instance',
        bookInstance: results.bookInstance,
      });
    }
  );
};
// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  async.parallel(
    {
      bookInstance: callback => {
        BookInstance.findById(req.params.id).exec(callback);
      },
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      // No erros so delete
      // Author delete has another if statement with an else for the delete execution
      // I'm not sure why so I wont include right now
      BookInstance.findByIdAndRemove(
        req.body.bookinstanceid,
        function deleteBookInstance(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list.
          res.redirect('/catalog/bookinstances');
        }
      );
    }
  );
};
// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  // Get book instance, books for form.
  async.parallel(
    {
      bookinstance: callback => {
        BookInstance.findById(req.params.id)
          .populate('book')
          .exec(callback);
      },
      books: callback => {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No bookinstance results
        var err = new Error('Book Instance not found');
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected status

      // Converting dates to formated strings
      let string_due_back;
      if (results.bookinstance.due_back) {
        string_due_back = results.bookinstance.due_back
          .toISOString(0, 19)
          .substring(0, 10);
      }
      let temp_status_list = ['Available', 'Maintenance', 'Loaned', 'Reserved'];

      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        book_list: results.books,
        bookinstance: results.bookinstance,
        due_back: string_due_back,
        status_list: temp_status_list,
      });
    }
  );
};
// Handle BooInstance update on POST.
exports.bookinstance_update_post = [
  //  validate and sanitise fields.
  body('book', 'Book must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('imprint', 'Imprint must be specified'),
  body('status').escape(),
  body('due_back', 'Invalid date'),
  (req, res, next) => {
    // Extracting request after validation and sanitization.
    const errors = validationResult(req, res, next);
    // Create a new Book Instance object with escapted/trimmed data and old id.
    var bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      Book.find({}, 'title').exec(function(err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookInstance,
        {},
        (err, thebookinstance) => {
          if (err) {
            return next(err);
          }
          // Sucessful - redirect to the book instance detail page.
          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
