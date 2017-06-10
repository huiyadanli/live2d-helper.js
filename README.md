# live2d-helper.js
Display Live2D models on web page.

Actually, it's a simple package for the Live2D official demo.

![Screenshot](https://raw.githubusercontent.com/huiyadanli/live2d-helper.js/master/assets/screenshot/asuna.gif)

## Setup
First, import scripts into your page.

You can [download](http://sites.cybernoids.jp/cubism-sdk2_e/webgl2-1) `live2d.min.js` from offcial website or get it from the `lib` folder.

And include the `live2d-helper.min.js` located on the `dist` folder.

```html
<script src="live2d.min.js"></script>
<script src="live2d-helper.min.js"></script>
```

## Example
```html
<canvas id="glcanvas" width="400" height="600"></canvas>

<script src="live2d.min.js"></script>
<script src="live2d-helper.min.js"></script>
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

[Demo](https://huiyadanli.github.io/i/live2d-demo/)

## Methods

### Model Load/Change/Release

* `loadModel(modelPath, callback)`
    * `modelPath` - path of model json data
    * `callback` - callback

* `releaseModel(no)`
    * `no` - model index, default: 0

* `releaseAllModel()` 

```
release all model
```

* `changeModel(newModelPath, callback)`
    * `newModelPath` - new model json data path
    * `callback` - callback

```
release the model in bottom of stack,
and the new model will push in top of stack.

! this function is recommended when you have only ctreated one model.
```

### Expression and Motion

* `setRandomExpression(no)`
    * `no` - model index, default: 0

```
set random expression
```

* `getExpressions(no)`
    * `no` - model index, default: 0

```
return all expression names.
iterate: 
for (var name in live2DHelper.getExpressions()) {
  // ...
}
```

* `setExpression(name, no)`
    * `name` - expression name
    * `no` - model index, default: 0

```
set model expression by name
```

* `startRandomMotion(no)`
    * `no` - model index, default: 0

* `startMotion(namespace, num, no)`
    * `namespace` - motion namespace
    * `num` - motion index
    * `no` - model index, default: 0

### Model Speak

* `playSound(path, no)`
    * `path` - sound path
    * `no` - model index, default: 0

```
Play sound use Audio DOM,
it only work once in FireFox.
```

* `playSoundAJAX(path, no)`
    * `path` - sound path
    * `no` - model index, default: 0

```
Play sound use AJAX and Web Audio API.
It can work in both Chrome and Firefox, the sound will be played after download.
```

### Control Model Head

* `startTurnHead(no)`
    * `no` - model index, default: 0

* `stopTurnHead(no)`
    * `no` - model index, default: 0

* `followPointer(event)`
    * `event` - mouse event

* `viewPointer(x, y)`
    * `x` - coordinate x
    * `y` - coordinate y

## Thanks
[avgjs / pixi-live2d](https://github.com/avgjs/pixi-live2d)

[DotSaikyo / Live2D](https://github.com/DotSaikyo/Live2D)

[kakinuma4ko / WebLive2DMurakumo](https://github.com/kakinuma4ko/WebLive2DMurakumo)


## License
MIT