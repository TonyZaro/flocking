(function() {
    var canvas = document.getElementsByTagName('canvas')[0];
	var header = document.getElementsByTagName('header')[0];

    function resizeCanvas() {
            canvas.height = window.innerHeight - header.offsetHeight;

    }
    resizeCanvas();


})();