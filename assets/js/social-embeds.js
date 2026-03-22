(function () {
	function loadScript(src, onLoad) {
		var script = document.querySelector('script[src="' + src + '"]');
		if (script) {
			if (script.dataset.loaded === "true") {
				onLoad();
				return;
			}

			script.addEventListener("load", onLoad, { once: true });
			return;
		}

		script = document.createElement("script");
		script.src = src;
		script.async = true;
		script.addEventListener("load", function () {
			script.dataset.loaded = "true";
			onLoad();
		}, { once: true });
		document.body.appendChild(script);
	}

	function initEmbeds() {
		var twitterBlock = document.querySelector(".social-proof-tweet");
		if (twitterBlock) {
			loadScript("https://platform.twitter.com/widgets.js", function () {
				if (window.twttr && window.twttr.widgets) {
					var tweetContainers = document.querySelectorAll(".social-proof-tweet[data-tweet-id]");
					tweetContainers.forEach(function (container) {
						if (
							container.dataset.rendered === "true" ||
							container.dataset.rendering === "true" ||
							container.querySelector("iframe")
						) {
							container.dataset.rendered = "true";
							return;
						}

						var tweetId = container.dataset.tweetId;
						if (!tweetId) {
							return;
						}

						container.dataset.rendering = "true";
						container.innerHTML = "";

						window.twttr.widgets.createTweet(tweetId, container, {
							align: "center",
							dnt: true,
							theme: "dark",
							lang: "es"
						}).then(function (el) {
							container.dataset.rendering = "false";
							if (el) {
								container.dataset.rendered = "true";
							}
						}).catch(function () {
							container.dataset.rendering = "false";
							container.dataset.rendered = "true";
						});
					});
				}
			});
		}

		var instagramBlock = document.querySelector(".instagram-media");
		if (instagramBlock) {
			loadScript("https://www.instagram.com/embed.js", function () {
				if (window.instgrm && window.instgrm.Embeds) {
					window.instgrm.Embeds.process();
				}
			});
		}
	}

	function setDefaultAccordionState() {
		var accordions = document.querySelectorAll(".social-proof-card");
		if (!accordions.length) {
			return;
		}

		var visibleCount = window.matchMedia("(max-width: 736px)").matches ? 1 : 3;
		accordions.forEach(function (accordion, index) {
			accordion.open = index < visibleCount;
		});
	}

	function initSocialProofAccordions() {
		var accordions = document.querySelectorAll(".social-proof-card");
		accordions.forEach(function (accordion) {
			if (accordion.dataset.bound === "true") {
				return;
			}

			accordion.dataset.bound = "true";
			accordion.addEventListener("toggle", function () {
				if (accordion.dataset.syncing === "true") {
					return;
				}

				if (window.matchMedia("(min-width: 1281px)").matches) {
					var groupIndex = Math.floor(Array.prototype.indexOf.call(accordions, accordion) / 3);
					var start = groupIndex * 3;
					var end = start + 3;
					accordions.forEach(function (item, index) {
						if (index < start || index >= end || item === accordion) {
							return;
						}

						item.dataset.syncing = "true";
						item.open = accordion.open;
						window.setTimeout(function () {
							item.dataset.syncing = "false";
						}, 0);
					});
				}

				if (accordion.open) {
					window.setTimeout(initEmbeds, 120);
				}
			});
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", function () {
			setDefaultAccordionState();
			initEmbeds();
			initSocialProofAccordions();
		}, { once: true });
	} else {
		setDefaultAccordionState();
		initEmbeds();
		initSocialProofAccordions();
	}
})();
