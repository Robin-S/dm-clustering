Wobbel.require("console"); //Use a custom console
Wobbel.require("ImageBuffer");
Wobbel.require("Kmeans");
Wobbel.require("DBSCAN");

function main() {
    
    var image_urls = [
//             'img/chrome-512.png',
//             'img/flame-512.png',
             'img/zebra-snail.png',
        ],
        size = 128;
    
    console.log("Created by:", { name: "Robin Smit", studentNumber: 4043561 });
    
    // Configure custom console for displaying images
    console.extendType("object", "HTMLImageElement", x => x instanceof HTMLImageElement, function(img) {
        var canvas = createElement("canvas", { width: size, height: size });
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        canvas.style.border = "1px solid #EEE";
        return canvas;
    });
    console.extendType("object", "HTMLCanvasElement", x => x instanceof HTMLCanvasElement, function(canvas) {
        var img = new Image();
        img.src = canvas.toDataURL();
        img.width = size;
        img.style.border = "1px solid #EEE";
        return img;
    });
    console.extendType("number", "negative", n => n < 0, function(n) {
        return createElement("span", { innerHTML: n, style: { color: "#F55" }});
    });
    
    console.log("Loading images. Please wait...");
    
    // Load the data sets (images)
    (new ImageBuffer(image_urls)).load(e => {
        console.log("Images loaded in {}ms"._(e.time));
        e.images.forEach(onLoad);
    });
}

function onLoad(original) {
    
    //Preprocessing
    {
        var width  = original.width,
            height = original.height,
            ctx    = createElement("canvas", { width, height }).getContext("2d");

        ctx.drawImage(original, 0, 0);

        var data = ctx.getImageData(0, 0, width, height).data;
        for (var i = 0, X = []; i < data.length; i += 4)
            X.push({
                color: data.slice(i, i + 4),
                position: [i / 4 % width, Math.floor(i / 4 / width)],
            });
    }

    //k-means
    {
        var k = 4;
        console.log("\nRunning k-means (|X|=", X.length, ", k=", k, ")");
        var kmeans = new Kmeans(X, x => x.color);
        var result = kmeans.exec(k, plot);
        console.log("Result:", result);
        
        plot_color(X);
        plot(...result.clusters);
    }

    //DB-SCAN
    result.clusters.forEach(cluster => {
        
        /* Create a mask in preperation for a custom getNeighbours-function
         */
        for (var i = 0, mask = [], j = 0; j < cluster.length; i++) {
            var inCluster = X[i] === cluster[j];
            mask.push(inCluster);
            if (inCluster)
                j++;
        }
        for (; i < X.length; i++)
            mask.push(false);
        
        /* Because we know we are dealing with pixel positions,
         *  we only have to check distances within a given radius
         *  from the center.
         */
        function getNeighbours(fx, r, distance) {
            var neighbours = [],
                check_positions = [];
            for (var dy = 1; dy <= r; dy++) {
                for (var dx = 0; distance(fx, [fx[0] + dx, fx[1] + dy]) <= r; dx++)
                    check_positions.push(
                        // 4 rotational symmetries
                        [fx[0] + dx, fx[1] + dy],
                        [fx[0] - dy, fx[1] + dx],
                        [fx[0] - dx, fx[1] - dy],
                        [fx[0] + dy, fx[1] - dx]
                    );
            }

            forEach(check_positions, function([x, y]) {
                var index = x + width * y;
                if (0 <= x && x < width && 0 <= y && y < height && mask[index])
                    neighbours.push(X[index]);
            });

            return neighbours;
        }

        console.log("\nRunning DBSCAN (|X|=", cluster.length, "), input:"); plot_color(cluster);
        var start_time = now();
        var dbscan = new DBSCAN(cluster, x => x.position, euclidean);
        var result = dbscan.exec(2.5, 9, getNeighbours);
        console.log("DBSCAN done in", now() - start_time, "ms");
        console.log("Result:", result);

        plot(...result.clusters);
    });

    function plot(...dataSets) {
        console.log(...map(dataSets, function(data) {

            var canvas  = createElement("canvas", { width, height }),
                ctx     = canvas.getContext("2d"),
                imgData = ctx.createImageData(width, height);

            forEach(data, pixel => {
                var offset = (pixel.position[0] + pixel.position[1] * width) * 4;
                imgData.data[offset + 0] = 255;
                imgData.data[offset + 1] = 255;
                imgData.data[offset + 2] = 255;
                imgData.data[offset + 3] = 255;
            });

            ctx.putImageData(imgData, 0, 0);

            return canvas;
        }));
    }
    function plot_color(...dataSets) {
        console.log(...map(dataSets, function(data) {

            var canvas  = createElement("canvas", { width, height }),
                ctx     = canvas.getContext("2d"),
                imgData = ctx.createImageData(width, height);

            forEach(data, pixel => {
                var offset = (pixel.position[0] + pixel.position[1] * width) * 4;
                imgData.data[offset + 0] = pixel.color[0];
                imgData.data[offset + 1] = pixel.color[1];
                imgData.data[offset + 2] = pixel.color[2];
                imgData.data[offset + 3] = pixel.color[3];
            });

            ctx.putImageData(imgData, 0, 0);

            return canvas;
        }));
    }
}

// Distance functions
function manhattan(a, b) {
    for (var i = 0, d = 0; i < a.length; i++)
        d += Math.abs(a[i] - b[i]);
    return d;
}
function euclidean(a, b) {
    for (var i = 0, d = 0; i < a.length; i++)
        d += Math.pow(a[i] - b[i], 2);
    return Math.sqrt(d);
}

// Utility functions
function subtract(a, b) {
    return a - b;
}
function min_index(values, f=I, cmp=subtract) {
    var min_value = f(values[0]),
        min_index = 0;
    for (var i = 1, v; i < values.length; i++)
        if (cmp(v = f(values[i]), min_value) < 0) {
            min_value = v;
            min_index = i;
        }
    return min_index;
}
function min(values, f=I, cmp=subtract) {
    return values[min_index(values, f, cmp)];
}