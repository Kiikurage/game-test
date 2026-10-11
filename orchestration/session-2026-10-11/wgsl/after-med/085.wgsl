// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms

struct objectStruct {
	nodeUniform0 : f32,
	nodeUniform1 : f32,
	nodeUniform2 : vec3<f32>,
	nodeUniform3 : vec3<f32>,
	nodeUniform4 : mat4x4<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : f32,
	nodeUniform9 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	cameraPosition : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) v_positionView : vec4<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) nodeVarying5 : vec4<f32>,
	@location( 3 ) nodeVarying6 : vec4<f32>,
	@location( 4 ) nodeVarying7 : vec4<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = vec4<f32>( mix( vec3<f32>( 0.5, 0.45, 0.4 ), vec3<f32>( 0.4, 0.37, 0.34 ), nodeVarying5.x ), 1.0 );
	nodeVar2 = ( object.nodeUniform1 - nodeVarying6.w );
	nodeVar3 = clamp( ( nodeVar2 / nodeVarying7.w ), 0.0, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * ( ( ( ( 0.32 * ( 1.0 - nodeVar3 ) ) * smoothstep( 0.0, 0.08, nodeVar3 ) ) * pow( clamp( ( 1.0 - length( ( ( nodeVarying8 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) ) ), 0.0, 1.0 ), 1.6 ) ) * ( step( 0.0, nodeVar2 ) * step( nodeVar2, nodeVarying7.w ) ) ) );
	Output = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar9 = ( - v_positionView.xyz.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.xyz.z ) );
	nodeVar10 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform2, object.nodeUniform3, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform6 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform7 * object.nodeUniform7 ) * nodeVar9 ) * nodeVar9 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar10;

	// result

	output.color = nodeVar10;

	return output;

}
