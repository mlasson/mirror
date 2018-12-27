
interface Control {
    root : HTMLElement;
}

class FormControl implements Control {
    private form : HTMLFormElement; 

    constructor() {
        this.form = document.createElement('form');
        this.form.className = "container";
    }

    public get root() {
        return this.form;
    } 

    public add(e : Control) {
        this.form.appendChild(e.root)
    }
}


class RangeControl implements Control {
    private static id : number = 0;
    min : number = 0; 
    max : number = 0; 
    private _label : string; 
    private callbacks :  ((input : number) => void) [] = [];

    private elements : {
        div : HTMLDivElement;
        input : HTMLInputElement;
        label : HTMLLabelElement;
    };

    constructor (min : number, max : number) {
        this.min = min; 
        this.max = max;
        RangeControl.id ++;
        var this_id = 'formControlRange' + RangeControl.id;
        this.elements = {
            div : document.createElement('div'),
            input : document.createElement('input'),
            label : document.createElement('label'),
        };
        this.elements.div.appendChild(this.elements.label);
        this.elements.div.appendChild(this.elements.input);
        this.elements.div.className = 'form-group';
        this.elements.input.id = this_id;
        this.elements.input.className = 'form-control-range';
        this.elements.input.type = 'range';
        this.elements.label.htmlFor = this_id;
        this.elements.input.oninput = () => { 
            for (let f of this.callbacks) {
                f(this.value);
            };
        }
    }

    public get value() : number {
        return this.min + Number(this.elements.input.value) * (this.max - this.min) / 100;
    }

    public set value(x: number) {
        this.elements.input.value = String(100 * (x - this.min) / (this.max - this.min));
    }

    public get label(): string {
		return this._label;
	}

	public set label(value: string) {
        console.log(value);
        this._label = value;
        this.elements.label.textContent = value;
    }
    
    public get root() {
        return this.elements.div;
    }

    public onChange (cb: (input : number) => void) {
        this.callbacks.push(cb);
    }

}

class State {
    x : RangeControl;
    y : RangeControl;
    z : RangeControl;
    constructor (x : RangeControl, y : RangeControl, z : RangeControl) {
        this.x = x;
        this.y = y; 
        this.z = z;
    }
}

function createState(): State {
    let form = new FormControl();    
    let x = new RangeControl(-5,5);
    let y = new RangeControl(-5,5);
    let z = new RangeControl(-5,5);

    document.body.appendChild(form.root);
    form.add(x);
    form.add(y);
    form.add(z);

    x.value = 0.0;
    y.value = 0.0; 
    z.value = 0.0;
    x.label = "x";
    y.label = "y";
    z.label = "z";

    return new State(x,y,z);
}


class Game {
    private _renderCallbacks : (() => void) [];
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _sphere: BABYLON.Mesh;
    private _camera: BABYLON.ArcRotateCamera;
    private _lights: Array<BABYLON.Light>;

    constructor(canvasElement : string) {
        this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    createScene() : void {
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);

        // Create a FreeCamera, and set its position to (x:0, y:5, z:-10).
        this._camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), this._scene);
        
        // Target the camera to scene origin.
        this._camera.setTarget(BABYLON.Vector3.Zero());

        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false, true);

        this._lights = [];
        this._lights.push(new BABYLON.PointLight('light1', new BABYLON.Vector3(0,10,0), this._scene));
        this._lights.push(new BABYLON.PointLight('light2', new BABYLON.Vector3(5,10,0), this._scene));

        // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
        this._sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
                                {segments: 16, diameter: 2}, this._scene);

        // Move the sphere upward 1/2 of its height.
        this._sphere.position.y = 0;

        // Create a built-in "ground" shape.
        let ground = BABYLON.MeshBuilder.CreateGround('ground1',
                                {width: 6, height: 6, subdivisions: 2}, this._scene);
    }

    doRender(state : State) : void {
        // Run the render loop.
        this._engine.runRenderLoop(() => {
            if (this._sphere) {
              this._sphere.position.x = state.x.value;
              this._sphere.position.y = state.y.value;
              this._sphere.position.z = state.z.value;
            }
            this._scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let game = new Game('renderCanvas');
    let state = createState();
    game.createScene();
    game.doRender(state);
});
