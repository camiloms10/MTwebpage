(function () {
	var postsUrl = "data/posts.json";

	function formatDate(value) {
		if (!value) return "";
		var date = new Date(value);
		return new Intl.DateTimeFormat("es-MX", {
			day: "numeric",
			month: "long",
			year: "numeric"
		}).format(date);
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function buildMetaLine(parts) {
		return parts.filter(Boolean).join(" · ");
	}

	function sanitizeBeehiivContent(html) {
		if (!html || typeof html !== "string") return "";
		var parser = new DOMParser();
		var doc = parser.parseFromString("<div>" + html + "</div>", "text/html");
		var root = doc.body.firstElementChild;
		if (!root) return "";

		function cleanNode(node, ownerDoc) {
			if (node.nodeType === Node.TEXT_NODE) {
				return ownerDoc.createTextNode(node.textContent || "");
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return null;
			}

			var tag = node.tagName.toLowerCase();
			var passthrough = {
				p: true,
				h1: true,
				h2: true,
				h3: true,
				h4: true,
				ul: true,
				ol: true,
				li: true,
				blockquote: true,
				strong: true,
				b: true,
				em: true,
				i: true,
				br: true,
				hr: true,
				picture: true,
				source: true,
				img: true,
				a: true,
				iframe: true
			};

			if (!passthrough[tag]) {
				var fragment = ownerDoc.createDocumentFragment();
				for (var i = 0; i < node.childNodes.length; i += 1) {
					var cleanedChild = cleanNode(node.childNodes[i], ownerDoc);
					if (cleanedChild) fragment.appendChild(cleanedChild);
				}
				return fragment;
			}

			var element = ownerDoc.createElement(tag);

			if (tag === "a") {
				var href = node.getAttribute("href");
				if (href) {
					if (/enfrio\.madridtotal\.mx/i.test(href)) {
						element.setAttribute("href", "#article-subscribe");
						element.className = "article-subscribe-link";
					} else {
						element.setAttribute("href", href);
					}
					if (/^https?:\/\//i.test(href) && !/enfrio\.madridtotal\.mx/i.test(href)) {
						element.setAttribute("target", "_blank");
						element.setAttribute("rel", "noopener noreferrer");
					}
				}
			}

			if (tag === "blockquote" && node.classList.contains("twitter-tweet")) {
				element.className = "twitter-tweet";
			}

			if (tag === "img") {
				var src = node.getAttribute("src");
				if (src) element.setAttribute("src", src);
				var alt = node.getAttribute("alt");
				element.setAttribute("alt", alt || "");
				element.setAttribute("loading", "lazy");
			}

			if (tag === "source") {
				var srcset = node.getAttribute("srcset");
				if (srcset) element.setAttribute("srcset", srcset);
				var media = node.getAttribute("media");
				if (media) element.setAttribute("media", media);
			}

			if (tag === "iframe") {
				var iframeSrc = node.getAttribute("src");
				if (!iframeSrc) return null;
				element.setAttribute("src", iframeSrc);
				element.setAttribute("loading", "lazy");
				element.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
				element.setAttribute("allowfullscreen", "");
			}

			for (var j = 0; j < node.childNodes.length; j += 1) {
				var child = cleanNode(node.childNodes[j], ownerDoc);
				if (child) element.appendChild(child);
			}

			if ((tag === "p" || tag === "li") && !element.textContent.trim() && !element.querySelector("img, iframe")) {
				return null;
			}

			return element;
		}

		var cleanDoc = document.implementation.createHTMLDocument("");
		var container = cleanDoc.createElement("div");

		for (var i = 0; i < root.childNodes.length; i += 1) {
			var cleanChild = cleanNode(root.childNodes[i], cleanDoc);
			if (cleanChild) container.appendChild(cleanChild);
		}

		return container.innerHTML;
	}

	function ensureXWidgets(container) {
		if (!container || !container.querySelector(".twitter-tweet")) return;

		function loadWidgets() {
			if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.load === "function") {
				window.twttr.widgets.load(container);
			}
		}

		if (window.twttr && window.twttr.widgets) {
			loadWidgets();
			return;
		}

		if (!document.getElementById("twitter-wjs")) {
			var script = document.createElement("script");
			script.id = "twitter-wjs";
			script.async = true;
			script.defer = true;
			script.src = "https://platform.twitter.com/widgets.js";
			script.onload = loadWidgets;
			document.body.appendChild(script);
			return;
		}

		window.setTimeout(loadWidgets, 250);
	}

	function renderFeed(data) {
		var status = document.getElementById("newsletter-status");
		var featured = document.getElementById("newsletter-featured");
		var list = document.getElementById("newsletter-list");
		var loadMoreWrap = document.getElementById("newsletter-load-more-wrap");
		var loadMoreButton = document.getElementById("newsletter-load-more");

		if (!status || !featured || !list) return;

		var posts = Array.isArray(data.posts) ? data.posts.slice().sort(function (a, b) {
			return new Date(b.published_at || 0) - new Date(a.published_at || 0);
		}) : [];
		if (!posts.length) {
			status.textContent = "Todavia no hay publicaciones sincronizadas.";
			return;
		}

		status.hidden = true;

		var primary = posts[0];
		var secondary = posts.slice(1);
		var visibleCount = 2;

		function renderCard(post) {
			return [
				'<article class="newsletter-card">',
				'<a class="newsletter-card-link" href="newsletter-post.html?slug=' + encodeURIComponent(post.slug) + '" aria-label="Leer ' + escapeHtml(post.title) + '">',
				'<span class="newsletter-card-image" style="background-image: linear-gradient(180deg, rgba(12, 17, 24, 0.05), rgba(12, 17, 24, 0.72)), url(\'' + escapeHtml(post.cover_image_url) + '\');"></span>',
				'<div class="newsletter-card-body">',
				'<p class="featured-meta">' + escapeHtml(buildMetaLine([formatDate(post.published_at)])) + '</p>',
				'<h3>' + escapeHtml(post.title) + '</h3>',
				'<p>' + escapeHtml(post.excerpt) + '</p>',
				'<div class="card-tags">' + (post.tags || []).map(function (tag) {
					return '<span>' + escapeHtml(tag) + '</span>';
				}).join("") + '</div>',
				'</div>',
				'</a>',
				'</article>'
			].join("");
		}

		function renderSecondary() {
			list.innerHTML = secondary.slice(0, visibleCount).map(renderCard).join("");

			if (!loadMoreWrap || !loadMoreButton) return;
			var hasMore = visibleCount < secondary.length;
			loadMoreWrap.hidden = !hasMore;
			loadMoreButton.hidden = !hasMore;
		}

		featured.hidden = false;
		featured.innerHTML = [
			'<a class="newsletter-card-link newsletter-card-link-featured" href="newsletter-post.html?slug=' + encodeURIComponent(primary.slug) + '" aria-label="Leer ' + escapeHtml(primary.title) + '">',
			'<div class="featured-media" style="background-image: linear-gradient(180deg, rgba(9, 12, 17, 0.18), rgba(9, 12, 17, 0.72)), url(\'' + escapeHtml(primary.cover_image_url) + '\');"></div>',
			'<div class="featured-copy">',
			'<p class="featured-meta">' + escapeHtml(buildMetaLine([formatDate(primary.published_at)])) + '</p>',
			'<h3>' + escapeHtml(primary.title) + '</h3>',
			'<p>' + escapeHtml(primary.excerpt) + '</p>',
			'<div class="card-tags">' + (primary.tags || []).map(function (tag) {
				return '<span>' + escapeHtml(tag) + '</span>';
			}).join("") + '</div>',
			'</div>',
			'</a>'
		].join("");

		renderSecondary();

		if (loadMoreButton) {
			loadMoreButton.onclick = function () {
				visibleCount += 3;
				renderSecondary();
			};
		}
	}

	function renderHomePreview(data) {
		var container = document.getElementById("newsletter-home-preview");
		if (!container) return;

		var posts = Array.isArray(data.posts) ? data.posts.slice().sort(function (a, b) {
			return new Date(b.published_at || 0) - new Date(a.published_at || 0);
		}) : [];

		var previewPosts = posts.slice(0, 2);
		if (!previewPosts.length) return;

		container.hidden = false;
		container.removeAttribute("hidden");
		container.innerHTML = previewPosts.map(function (post) {
			var coverStyle = post.cover_image_url
				? "background-image: linear-gradient(180deg, rgba(12, 17, 24, 0.08), rgba(12, 17, 24, 0.78)), url('" + escapeHtml(post.cover_image_url) + "');"
				: "background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));";

			return [
				'<article class="newsletter-home-card">',
				'<a class="newsletter-card-link" href="newsletter-post.html?slug=' + encodeURIComponent(post.slug) + '" aria-label="Leer ' + escapeHtml(post.title) + '">',
				'<span class="newsletter-home-card-image" style="' + coverStyle + '"></span>',
				'<div class="newsletter-home-card-body">',
				'<p class="featured-meta">' + escapeHtml(buildMetaLine([formatDate(post.published_at)])) + '</p>',
				'<h3>' + escapeHtml(post.title) + '</h3>',
				'<p>' + escapeHtml(post.excerpt || "Leer el ultimo EN FRIO dentro de Madrid Total.") + '</p>',
				'</div>',
				'</a>',
				'</article>'
			].join("");
		}).join("");
	}

	function renderArticle(data) {
		var status = document.getElementById("article-status");
		var article = document.getElementById("newsletter-article");
		if (!status || !article) return;

		var params = new URLSearchParams(window.location.search);
		var slug = params.get("slug");
		var posts = Array.isArray(data.posts) ? data.posts : [];
		var post = posts.find(function (entry) {
			return entry.slug === slug;
		});

		if (!post) {
			status.innerHTML = 'No encontramos ese articulo. <a href="newsletter.html">Volver al newsletter</a>.';
			return;
		}

		status.hidden = true;
		article.hidden = false;

		article.className = "newsletter-article";
		article.innerHTML = [
			'<header class="article-header">',
			'<p class="eyebrow">EN FRIO</p>',
			'<h1>' + escapeHtml(post.title) + '</h1>',
			'<p class="article-meta">' + escapeHtml(buildMetaLine([formatDate(post.published_at), post.author || "Madrid Total"])) + '</p>',
			'<p class="article-excerpt">' + escapeHtml(post.excerpt) + '</p>',
			'<div class="article-cover"><img src="' + escapeHtml(post.cover_image_url) + '" alt="' + escapeHtml(post.title) + '"></div>',
			'</header>',
			'<div class="article-body">' + sanitizeBeehiivContent(post.content_html || "") + '</div>',
			'<div class="newsletter-card-actions">',
			'<a class="button ghost-light" href="newsletter.html">Volver al archivo</a>',
			'<a class="button primary" href="#article-subscribe">Suscribirme a EN FRIO</a>',
			'</div>'
		].join("");

		ensureXWidgets(article);

		document.title = "Madrid Total | " + post.title;
	}

	fetch(postsUrl)
		.then(function (response) {
			if (!response.ok) throw new Error("No se pudo cargar el feed");
			return response.json();
		})
		.then(function (data) {
			renderFeed(data);
			renderHomePreview(data);
			renderArticle(data);
		})
		.catch(function () {
			var feedStatus = document.getElementById("newsletter-status");
			var articleStatus = document.getElementById("article-status");
			if (feedStatus) feedStatus.textContent = "No pudimos cargar el feed local.";
			if (articleStatus) articleStatus.textContent = "No pudimos cargar este articulo.";
		});
})();
