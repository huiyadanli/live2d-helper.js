# live2d-helper.js
Display Live2D models on web page.
Actually, it's a simple package for the Live2D official demo.

# Setup
First, import scripts into your page.
You can [download](http://sites.cybernoids.jp/cubism-sdk2_e/webgl2-1) `live2d.min.js` from offcial website or get it from the `lib` folder.
And the `live2d-helper.min.js` located on the `dist` folder.
```html
<script src="live2d.min.js"></script>
<script src="live2d-helper.min.js"></script>
```

# Usage
```html
<script src="live2d.min.js"></script>
<script src="live2d-helper.min.js"></script>

<canvas id="glcanvas" width="400" height="600"></canvas>

<script type="text/javascript">
    var live2DHelper = new Live2DHelper({canvas: 'glcanvas'});
    
    window.onload = function() {
        var path = "name.model.json";
        live2DHelper.loadModel(path, function(){
            // do something...
        });
    };
</script>
```

# License
MIT