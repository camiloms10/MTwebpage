(function () {
	var source = 'data/social-followers.json';

	function formatFollowers(value) {
		if (typeof value !== 'number' || !isFinite(value)) {
			return null;
		}

		if (value >= 1000000) {
			return (Math.round((value / 1000000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'M seguidores';
		}

		if (value >= 1000) {
			return (Math.round((value / 1000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'k seguidores';
		}

		return String(value) + ' seguidores';
	}

	function formatAudience(value) {
		if (typeof value !== 'number' || !isFinite(value)) {
			return null;
		}

		if (value >= 1000000) {
			return (Math.round((value / 1000000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'M+ audiencia social';
		}

		if (value >= 1000) {
			return (Math.round((value / 1000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'k+ audiencia social';
		}

		return String(value) + '+ audiencia social';
	}

	function formatAudienceCompact(value) {
		if (typeof value !== 'number' || !isFinite(value)) {
			return null;
		}

		if (value >= 1000000) {
			return (Math.round((value / 1000000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'M+';
		}

		if (value >= 1000) {
			return (Math.round((value / 1000) * 10) / 10).toFixed(1).replace(/\.0$/, '') + 'k+';
		}

		return String(value) + '+';
	}

	function formatUpdatedAt(value) {
		var date = new Date(value);
		if (isNaN(date.getTime())) {
			return null;
		}

		return 'Ultima verificacion: ' + date.toLocaleDateString('es-MX', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function render(data) {
		if (!data || !data.platforms) {
			return;
		}

		var total = 0;
		var keys = Object.keys(data.platforms);

		for (var i = 0; i < keys.length; i += 1) {
			var key = keys[i];
			var platform = data.platforms[key];

			if (!platform || typeof platform.followers !== 'number') {
				continue;
			}

			total += platform.followers;

			var value = formatFollowers(platform.followers);
			var nodes = document.querySelectorAll('[data-social-followers="' + key + '"]');
			for (var j = 0; j < nodes.length; j += 1) {
				nodes[j].textContent = value;
			}
		}

		var detailX = document.querySelector('[data-social-followers="x-detail"]');
		if (detailX && data.platforms.x && typeof data.platforms.x.followers === 'number') {
			detailX.textContent = formatFollowers(data.platforms.x.followers);
		}

		var totalNodes = document.querySelectorAll('[data-social-total]');
		var audience = formatAudience(total);
		for (var k = 0; k < totalNodes.length; k += 1) {
			totalNodes[k].textContent = audience;
		}

		var compactTotalNodes = document.querySelectorAll('[data-social-total-compact]');
		var compactAudience = formatAudienceCompact(total);
		for (var l = 0; l < compactTotalNodes.length; l += 1) {
			compactTotalNodes[l].textContent = compactAudience;
		}

		var updatedNode = document.querySelector('[data-social-updated]');
		var updatedLabel = formatUpdatedAt(data.updatedAt);
		if (updatedNode && updatedLabel) {
			updatedNode.textContent = updatedLabel;
		}
	}

	fetch(source)
		.then(function (response) {
			if (!response.ok) {
				throw new Error('No se pudo cargar ' + source);
			}

			return response.json();
		})
		.then(render)
		.catch(function (error) {
			console.warn(error.message);
		});
})();
