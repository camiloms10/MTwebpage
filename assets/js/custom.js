(function () {
	var links = document.querySelectorAll('#nav .links a[href^="#"]');
	for (var i = 0; i < links.length; i += 1) {
		links[i].addEventListener('click', function () {
			for (var j = 0; j < links.length; j += 1) {
				links[j].parentElement.classList.remove('active');
			}
			this.parentElement.classList.add('active');
		});
	}
})();
