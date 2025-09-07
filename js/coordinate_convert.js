function grid_to_lat_lon(x_grid, y_grid, centered_at_cell = true) {
    const DIVISIONS = 2048;
    const SUBDIVISIONS = 1000;

    if (centered_at_cell) {
        x_grid += 0.5 / SUBDIVISIONS;
        y_grid += 0.5 / SUBDIVISIONS;
    }

    const MAX_MERCATOR = 20037508.34;

    const x_mercator = (x_grid / DIVISIONS) * (2 * MAX_MERCATOR) - MAX_MERCATOR;
    const y_mercator = MAX_MERCATOR - (y_grid / DIVISIONS) * (2 * MAX_MERCATOR);

    const RADIUS = 6378137.0;
    const lon = (x_mercator / RADIUS) * (180 / Math.PI);
    const lat = (2 * Math.atan(Math.exp(y_mercator / RADIUS)) - Math.PI / 2) * (180 / Math.PI);

    return { lon, lat };
}

function generate_url(x_grid, y_grid, zoom_level, centered_at_cell = true) {
    const coords = grid_to_lat_lon(x_grid, y_grid, centered_at_cell);
    return `https://wplace.live/?lng=${coords.lon}&lat=${coords.lat}&zoom=${zoom_level}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        tx: { el: document.getElementById('tx-coord'), errorEl: document.getElementById('tx-error'), min: 0, max: 2047, name: 'Tile X' },
        px: { el: document.getElementById('px-coord'), errorEl: document.getElementById('px-error'), min: 0, max: 999, name: 'Pixel X' },
        ty: { el: document.getElementById('ty-coord'), errorEl: document.getElementById('ty-error'), min: 0, max: 2047, name: 'Tile Y' },
        py: { el: document.getElementById('py-coord'), errorEl: document.getElementById('py-error'), min: 0, max: 999, name: 'Pixel Y' },
    };

    const centeredCheckbox = document.getElementById('centered');
    const generateBtn = document.getElementById('generate-btn');
    const outputContainer = document.getElementById('output-container');
    const outputUrlLink = document.getElementById('output-url');
    const copyBtn = document.getElementById('copy-btn');
    const copyTooltip = document.getElementById('copy-tooltip');

    function validate() {
        let isValid = true;
        // Clear previous errors
        for (const key in inputs) {
            inputs[key].errorEl.textContent = '';
        }

        for (const key in inputs) {
            const input = inputs[key];
            const value = input.el.value;

            if (value === '') {
                input.errorEl.textContent = 'Value is required.';
                isValid = false;
                continue; // Don't run other checks if it's empty
            }

            // Check for non-integer values (e.g., '1.5', 'abc')
            if (!/^-?\d+$/.test(value)) {
                input.errorEl.textContent = 'Must be an integer.';
                isValid = false;
                continue;
            }

            const numValue = parseInt(value, 10);
            if (numValue < input.min || numValue > input.max) {
                input.errorEl.textContent = `Must be between ${input.min} and ${input.max}.`;
                isValid = false;
            }
        }

        return isValid;
    }

    generateBtn.addEventListener('click', () => {
        outputContainer.style.display = 'none'; // Hide output on new attempt

        if (!validate()) {
            return; // Stop if validation fails
        }

        const tx = parseInt(inputs.tx.el.value, 10);
        const px = parseInt(inputs.px.el.value, 10);
        const ty = parseInt(inputs.ty.el.value, 10);
        const py = parseInt(inputs.py.el.value, 10);

        const x = tx + px / 1000;
        const y = ty + py / 1000;

        const zoom = parseFloat(document.querySelector('input[name="zoom"]:checked').value, 10);
        const centered = centeredCheckbox.checked;

        const url = generate_url(x, y, zoom, centered);
        outputUrlLink.href = url;
        outputUrlLink.textContent = url;
        outputContainer.style.display = 'flex'; // Show the output container
    });

    copyBtn.addEventListener('click', () => {
        const urlToCopy = outputUrlLink.href;
        if (urlToCopy && urlToCopy !== '#') {
            navigator.clipboard.writeText(urlToCopy)
                .then(() => {
                    copyTooltip.classList.add('visible');
                    setTimeout(() => {
                        copyTooltip.classList.remove('visible');
                    }, 2000);
                })
                .catch(err => alert('Failed to copy URL.'));
        }
    });
});
