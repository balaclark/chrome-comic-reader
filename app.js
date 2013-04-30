
(function ($) {

  'use strict';

  var $droptarget = $('body');
  var $progressbar = $('.bar');

  function extractImages(file, opts) {

    var images = [];
    var fr = new FileReader();
    // var file = files[0];
    var re_file_ext = new RegExp(/\.(\w+)$/);
    var archive_class = ({ cbz: 'Unzipper', cbr: 'Unrarrer' })[file.name.toLowerCase().match(re_file_ext)[1]];
    var options = $.extend({
      start: function () {},
      extract: function (page_url) {},
      progress: function (percent_complete) {},
      finish: function (images) {},
    }, opts);

    if (!archive_class) {
      alert('invalid file type, only cbz and cbr are supported.');
      return false;
    }

    options.start(file);

    fr.onload = function () {

      var done = false;
      var ua = new bitjs.archive[archive_class](this.result, 'lib/bitjs/');

      ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.EXTRACT, function (e) {

        var mimetype, blob, url;
        var file_extension = e.unarchivedFile.filename.toLowerCase().match(re_file_ext)[1];

        switch (file_extension) {
          case 'jpg':
          case 'jpeg':
            mimetype = 'image/jpeg';
            break;
          case 'png':
            mimetype = 'image/png';
            break;
          case 'gif':
            mimetype = 'image/gif';
            break;
          default:
            return false;
        }

        blob = new Blob([e.unarchivedFile.fileData], { type: mimetype });
        url = window.URL.createObjectURL(blob);

        images.push(url);

        options.extract(url, blob);
      });

      ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.PROGRESS, function (e) {
        options.progress(Math.floor(e.currentBytesUnarchived / e.totalUncompressedBytesInArchive * 100));
      });

      ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.FINISH, function (e) {
        options.finish(images);
      });

      ua.start();
    };

    fr.readAsArrayBuffer(file);
  }

  function openComicArchive(file) {

    extractImages(file, {
      start: function (file) {
        this.file = file;
        $('#open').hide();
        $('#filename').text(file.name);
        $('#progressbar').show();
      },
      extract: function (url, blob) {
        // $('body').append($('<img>').attr('src', url).css('width', '10px'));
        // console.log(url, Math.floor(blob.size / 1024));
      },
      progress: function (percent_complete) {
        $progressbar.css('width', percent_complete + '%');
      },
      finish: function (pages) {

        var name = this.file.name.replace(/\.[a-z]+$/, '');
        var id = encodeURIComponent(name.toLowerCase());

        var book = new ComicBook('comic', pages, {
          // start: localStorage.getItem(id + '_last_page')
        });

        $(book).on('navigate', function (e) {
          console.log(e);
          // localStorage.setItem(id + '_last_page', page_number);
        });

        $('#filepicker').hide();
        $('#comic').show();

        book.draw();

        $(window).resize(function () {
          book.draw();
        });
      }
    });
  }

  document.body.addEventListener('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.add('dragover');
  }, false);

  document.body.addEventListener('dragleave', function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('dragover');
  }, false);

  document.body.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('dragover');
    openComicArchive(e.dataTransfer.files[0]);
  }, false);

  document.querySelector('#open').addEventListener('click', function (e) {
    chrome.fileSystem.chooseEntry({ type: 'openFile' }, function (entry) {
      if (entry) {
        entry.file(function (file) {
          openComicArchive(file);
        });
      }
    });
  }, false);

})(jQuery);
