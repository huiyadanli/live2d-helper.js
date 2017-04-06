var thisRef = this;

function Live2DHelper(setting)
{
    var defaultSetting = {
        canvas: ''
    };

    Object.assign(defaultSetting, setting)

    this.platform = window.navigator.platform.toLowerCase();
    
    this.gl = null;
    this.canvas = document.getElementById(defaultSetting.canvas);

    if(this.canvas == null) {
        console.log("live2d error: the canvas is undefined");
    }

    this.live2DMgr = new LAppLive2DManager(this.canvas);

    this.isDrawStart = false;
    
    this.dragMgr = null; /*new L2DTargetPoint();*/ 
    this.viewMatrix = null; /*new L2DViewMatrix();*/
    this.projMatrix = null; /*new L2DMatrix44()*/
    this.deviceToScreen = null; /*new L2DMatrix44();*/
    
    this.oldLen = 0;
    
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    /* virtual object */
    this.pModel = 0;

    this.init();
}


function getWebGLContext(canvas)
{
    var NAMES = [ "webgl" , "experimental-webgl" , "webkit-3d" , "moz-webgl"];

    for( var i = 0; i < NAMES.length; i++ ){
        try{
            var ctx = canvas.getContext(NAMES[i], {premultipliedAlpha : true});
            if(ctx) return ctx;
        }
        catch(e){}
    }
    return null;
}

Live2DHelper.prototype.init = function()
{    
    
    var width = this.canvas.width;
    var height = this.canvas.height;
    
    this.dragMgr = new L2DTargetPoint();

    
    var ratio = height / width;
    var left = LAppDefine.VIEW_LOGICAL_LEFT;
    var right = LAppDefine.VIEW_LOGICAL_RIGHT;
    var bottom = -ratio;
    var top = ratio;

    this.viewMatrix = new L2DViewMatrix();

    
    this.viewMatrix.setScreenRect(left, right, bottom, top);
    
    
    this.viewMatrix.setMaxScreenRect(LAppDefine.VIEW_LOGICAL_MAX_LEFT,
                                     LAppDefine.VIEW_LOGICAL_MAX_RIGHT,
                                     LAppDefine.VIEW_LOGICAL_MAX_BOTTOM,
                                     LAppDefine.VIEW_LOGICAL_MAX_TOP); 

    this.viewMatrix.setMaxScale(LAppDefine.VIEW_MAX_SCALE);
    this.viewMatrix.setMinScale(LAppDefine.VIEW_MIN_SCALE);

    this.projMatrix = new L2DMatrix44();
    this.projMatrix.multScale(1, (width / height));

    
    this.deviceToScreen = new L2DMatrix44();
    this.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0);
    this.deviceToScreen.multScale(2 / width, -2 / width);
    
    
    
    this.gl = getWebGLContext(this.canvas);
    if (!this.gl) {
        console.log("Failed to create WebGL context.");
        return;
    }
    
    Live2D.setGL(this.gl);

    
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    
    live2dStartDraw(this);
}


function live2dStartDraw(helper) {
    if(!helper.isDrawStart) {
        helper.isDrawStart = true;
        (function tick() {
                live2dDraw(helper); 

                var requestAnimationFrame = 
                    window.requestAnimationFrame || 
                    window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame || 
                    window.msRequestAnimationFrame;

                
                requestAnimationFrame(tick ,this.canvas);   
        })();
    }
}


function live2dDraw(helper)
{

    MatrixStack.reset();
    MatrixStack.loadIdentity();
    
    helper.dragMgr.update(); 
    //helper.live2DMgr.setDrag(helper.dragMgr.getX(), helper.dragMgr.getY());
    helper.live2DMgr.setDrag();
    
    helper.gl.clear(helper.gl.COLOR_BUFFER_BIT);
    
    MatrixStack.multMatrix(helper.projMatrix.getArray());
    MatrixStack.multMatrix(helper.viewMatrix.getArray());
    MatrixStack.push();
    
    for (var i = 0; i < helper.live2DMgr.numModels(); i++)
    {
        var model = helper.live2DMgr.getModel(i);

        if(model == null) return;
        
        if (model.initialized && !model.updating)
        {
            model.update();
            model.draw(helper.gl);
        }
    }
    
    MatrixStack.pop();
}


/**
 * --------------------------------------------------
 *                  canvas listener
 * --------------------------------------------------
 */

Live2DHelper.prototype.mouseEvent = function(e)
{
    e.preventDefault();
    
    if (e.type == "mousewheel") {

        if (e.clientX < 0 || this.canvas.clientWidth < e.clientX || 
        e.clientY < 0 || this.canvas.clientHeight < e.clientY)
        {
            return;
        }
        
        if (e.wheelDelta > 0) this.modelScaling(1.1); 
        else this.modelScaling(0.9); 

        
    } else if (e.type == "mousedown") {

        
        if("button" in e && e.button != 0) return;
        
        this.modelTurnHead(e);
        
    } else if (e.type == "mousemove") {
        
        followPointer(e);
        
    } else if (e.type == "mouseup") {
        
        
        if("button" in e && e.button != 0) return;
        
        this.lookFront();
        
    } else if (e.type == "mouseout") {
        
        lookFront();
        
    } else if (e.type == "contextmenu") {
        
        this.changeModel();
    }

}


Live2DHelper.prototype.touchEvent = function(e)
{
    e.preventDefault();
    
    var touch = e.touches[0];
    
    if (e.type == "touchstart") {
        if (e.touches.length == 1) modelTurnHead(touch);
        // onClick(touch);
        
    } else if (e.type == "touchmove") {
        followPointer(touch);
        
        if (e.touches.length == 2) {
            var touch1 = e.touches[0];
            var touch2 = e.touches[1];
            
            var len = Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2);
            if (thisRef.oldLen - len < 0) this.modelScaling(1.025); 
            else this.modelScaling(0.975); 
            
            thisRef.oldLen = len;
        }
        
    } else if (e.type == "touchend") {
        lookFront();
    }
}

/**
 * --------------------------------------------------
 *                   interactions
 * --------------------------------------------------
 */

Live2DHelper.prototype.modelScaling = function(scale)
{   
    var isMaxScale = this.viewMatrix.isMaxScale();
    var isMinScale = this.viewMatrix.isMinScale();
    
    this.viewMatrix.adjustScale(0, 0, scale);

    
    if (!isMaxScale)
    {
        if (this.viewMatrix.isMaxScale())
        {
            this.live2DMgr.maxScaleEvent();
        }
    }
    
    if (!isMinScale)
    {
        if (this.viewMatrix.isMinScale())
        {
            this.live2DMgr.minScaleEvent();
        }
    }
}


Live2DHelper.prototype.startTurnHead = function(no)
{
    if(no == null) no = 0;
    this.live2DMgr.models[no].setDragMgr(this.dragMgr);
}

Live2DHelper.prototype.stopTurnHead = function(no)
{
    if(no == null) no = 0;
    this.modelsViewPointer(0, 0);
    this.live2DMgr.models[no].setDragMgr(null);
}

Live2DHelper.prototype.followPointer = function(event)
{    
    var rect = event.target.getBoundingClientRect();
    
    var sx = this.transformScreenX(event.clientX - rect.left);
    var sy = this.transformScreenY(event.clientY - rect.top);
    var vx = this.transformViewX(event.clientX - rect.left);
    var vy = this.transformViewY(event.clientY - rect.top);

    this.lastMouseX = sx;
    this.lastMouseY = sy;
    //this.dragMgr.setPoint(vx, vy);
    this.viewPointer(vx, vy);
}

Live2DHelper.prototype.viewPointer = function(x, y)
{
    this.dragMgr.setPoint(x, y);
}


Live2DHelper.prototype.transformViewX = function(deviceX)
{
    var screenX = this.deviceToScreen.transformX(deviceX); 
    return this.viewMatrix.invertTransformX(screenX); 
}


Live2DHelper.prototype.transformViewY = function(deviceY)
{
    var screenY = this.deviceToScreen.transformY(deviceY); 
    return this.viewMatrix.invertTransformY(screenY); 
}


Live2DHelper.prototype.transformScreenX = function(deviceX)
{
    return this.deviceToScreen.transformX(deviceX);
}


Live2DHelper.prototype.transformScreenY = function(deviceY)
{
    return this.deviceToScreen.transformY(deviceY);
}

/**
 * load model
 * @param  {string}   path of model
 * @param  {Function} callback
 */
Live2DHelper.prototype.loadModel = function(modelPath, callback) {
    this.live2DMgr.loadModel(this.gl, modelPath, callback);
}

/**
 * release model
 * @param  {int} model index
 */
Live2DHelper.prototype.releaseModel = function(no) {
    if(no == null) no = 0;
    this.live2DMgr.releaseModel(this.gl, no);
}

/**
 * release all model
 */
Live2DHelper.prototype.releaseAllModel = function() {
    var count = this.live2DMgr.models.length;
    for(var i = count; i > 0; i--) {
        this.live2DMgr.releaseModel(this.gl, i);
    }
}

/**
 * release the model in bottom of stack ,
 * and the new model will push in top of stack.
 * ! this function is recommended when you have only ctreated one model.
 * @param  {string} new model path
 */
Live2DHelper.prototype.changeModel = function(newModelPath, callback) {
    this.live2DMgr.reloadFlg = true;
    this.live2DMgr.changeModel(this.gl, newModelPath, callback);
}

/**
 * set random expression
 * @param {int} no   model index, can be empty
 */
Live2DHelper.prototype.setRandomExpression = function(no) {
    if(no == null) no = 0;
    this.live2DMgr.models[no].setRandomExpression();
}

/**
 * return all expression names
 * @param  {int} no model index, can be empty
 * @return {array}    expression names array
 */
Live2DHelper.prototype.getExpressions = function(no) {
    if(no == null) no = 0;
    return this.live2DMgr.models[no].expressions;
}

/**
 * set model expression by name
 * @param {string} name expression name
 * @param {int} no   model index, can be empty
 */
Live2DHelper.prototype.setExpression = function(name, no) {
    if(no == null) no = 0;
    this.live2DMgr.models[no].setExpression(name);
}

/**
 * start random motion
 * @param  {[type]} no [description]
 * @return {[type]}    [description]
 */
Live2DHelper.prototype.startRandomMotion = function(no) {
    if(no == null) no = 0;
    this.live2DMgr.models[no].setRandomExpression();
}

Live2DHelper.prototype.startMotion = function(namespace, num, no) {
    if(no == null) no = 0;
    this.live2DMgr.models[no].startMotion(namespace, num, LAppDefine.PRIORITY_FORCE);
}

Live2DHelper.prototype.playSoundAJAX = function(path, no) {
    if(no == null) no = 0;
    this.live2DMgr.playSoundAJAX(path, no);
}

Live2DHelper.prototype.playSound = function(path, no) {
    if(no == null) no = 0;
    this.live2DMgr.playSound(path, no);
}

/**
 * ---------------------------------------------------------------
 *                         virtual method
 *   Make code more readable when many models in one canvas
 *   But it will cause many problem when the method is invoked in 
 *   a different order! So I abandon it.
 * ---------------------------------------------------------------
 */
Live2DHelper.prototype.getModel = function(no) {
    this.pModel = no;
    return this;
}

Live2DHelper.prototype.startPointer = function() {
    this.modelStartPointer(this.pModel);
    return this;
}

Live2DHelper.prototype.change = function(newModelPath) {
    this.modelStartPointer(this.pModel);
}