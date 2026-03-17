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
						if (container.dataset.rendered === "true") {
							return;
						}

						var tweetId = container.dataset.tweetId;
						if (!tweetId) {
							return;
						}

						window.twttr.widgets.createTweet(tweetId, container, {
							align: "center",
							dnt: true,
							theme: "dark",
							lang: "es"
						}).then(function (el) {
							if (el) {
								container.dataset.rendered = "true";
							}
						}).catch(function () {
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

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initEmbeds, { once: true });
	} else {
		initEmbeds();
	}
})();
