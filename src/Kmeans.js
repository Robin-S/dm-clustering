Wobbel.require("console");

var Kmeans = Class("Kmeans", function() {
    
    function Kmeans(data, filter) {
        this.data   = data;
        this.filter = filter;
    }
    
    function contains(V, u) {
        for (var i = 0; i < V.length; i++)
            if (equals(V[i], u))
                return true;
        return false;
    }
    
    function equals(a, b) {
        for (var i = 0; i < a.length; i++)
            if (a[i] !== b[i]) return false;
        return true;
    }
    
    function mean(V) {
        var u = (new Array(this.filter(V[0]).length)).fill(0);
        forEach(V, F(function(v) {
            for (var i = 0; i < v.length; i++)
                u[i] += v[i];
        }, this.filter));
        return map(u, x => x / V.length);
    }
    
    function distance(a, b) {
        for (var i = 0, total = 0; i < a.length; i++)
            total += Math.pow(b[i] - a[i], 2);
        return Math.sqrt(total);
    }
    
    function exec(k, plot) {
        
        console.log("Running {} (k={}, |X|={})"._(this.constructor.name, k, this.data.length));
        
        var X = this.data,
            clusters = [],
            centroids = [],
            r;
        
        // Initialize centroids
        while (centroids.length < k)
            if (!contains(centroids, r = this.filter(randomElement(X))))
                centroids.push(r);
        
        do {
            // Reset clusters
            for (var i = 0; i < k; i++)
                clusters[i] = [];

            // Assign points to a cluster
            for (var i = 0; i < X.length; i++) {
                var x = this.filter(X[i]);
                var j = getNearestCentroidIndex(x, centroids, distance);
                clusters[j].push(X[i]);
            }
            
            // Update centroids
            var _centroids = map(clusters, S => mean.call(this, S));
            
            // Calculate centroid movement
            var movement = map(centroids, function(c, j) {
                return distance(c, _centroids[j]);
            });
            
            centroids = _centroids;
        } while (any(movement, d => d !== 0));
        
        return { centroids, clusters };
    }
    
    function getNearestCentroidIndex(x, centroids, distance) {
        var nearestCentroidIndex = 0,
            nearestCentroidDistance = distance(x, centroids[0]);
        for (var i = 1, d; i < centroids.length; i++)
            if ((d = distance(x, centroids[i])) < nearestCentroidDistance) {
                nearestCentroidDistance = d;
                nearestCentroidIndex = i;
            }
        return nearestCentroidIndex;
    }
    
    
    definePrivate(this, "constructor", Kmeans);
    definePublic(this, [exec]);
    
});