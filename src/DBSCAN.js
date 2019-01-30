Wobbel.require("console");

var DBSCAN = Class("DBSCAN", function() {
    
    const Labels = {
        NOISE: 1,
        EDGE:  2,
        CORE:  3,
    };
    
    function DBSCAN(X, filter=I, distance) {
        
        this.X        = X;
        this.filter   = filter;
        this.distance = distance;
        
        for (var i = 0; i < X.length; i++)
            this.X[i]._index = i;
    }
    
    function exec(eps=1, minPts=4, getNeighbours=naive_getNeighbours) {
        
        for (var i = 0, j = 0; i < this.X.length; i++) {
            var x = this.X[i];
            if (x.label !== undefined)
                continue;
            
            var neighbours = getNeighbours.call(this, this.filter(x), eps, this.distance);
            if (neighbours.length < minPts)
                x.type = Labels.NOISE;
            else {
                x.type  = Labels.CORE;
                x.label = j++;
                for (var k = 0; k < neighbours.length; k++) {
                    var y = neighbours[k];
                    if (y.type === Labels.NOISE) {
                        y.type  = Labels.EDGE;
                        y.label = x.label;
                    }
                    else if (y.type === undefined) {
                        y.label = x.label;
                        var N = getNeighbours.call(this, this.filter(y), eps, this.distance);
                        if (N.length >= minPts) {
                            for (var n = 0; n < N.length; n++)
                                if (!neighbours.includes(N[n]))
                                    neighbours.push(N[n]);
                        }
                    }
                }
            }
        }
        
        for (var i = 0, clusters = [], types = []; i < this.X.length; i++) {
            var j = this.X[i].label;
            if (clusters[j] === undefined) {
                types[j] = [this.X[i].type];
                clusters[j] = [this.X[i]];
            }
            else {
                types[j].push(this.X[i].type);
                clusters[j].push(this.X[i]);
            }
        }
        
        return { clusters, types };
    }
    
    function naive_getNeighbours(fx, eps, distance) {
        return filter(this.X, function(y) {
            var dist = distance(fx, this.filter(y));
            return 0 < dist && dist <= eps;
        }, this);
    }
    
    definePrivate(this, "constructor", DBSCAN);
    definePublic(this, [exec]);
    
});