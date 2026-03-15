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

	var revealElements = document.querySelectorAll('.pillar-card, .partner-block, .partners-showcase, .fantasy-shell, .newsletter-shell, .social-panel');
	if ('IntersectionObserver' in window) {
		var observer = new IntersectionObserver(function (entries) {
			for (var k = 0; k < entries.length; k += 1) {
				if (entries[k].isIntersecting) {
					entries[k].target.classList.add('is-visible');
					observer.unobserve(entries[k].target);
				}
			}
		}, { threshold: 0.18 });

		for (var m = 0; m < revealElements.length; m += 1) {
			revealElements[m].classList.add('reveal-on-scroll');
			revealElements[m].style.transitionDelay = (m % 4) * 90 + 'ms';
			observer.observe(revealElements[m]);
		}
	}
})();
