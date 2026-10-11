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
	nodeUniform7 : f32
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
var<private> Output : vec4<f32>;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) v_positionView : vec4<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) nodeVarying5 : vec4<f32>,
	@location( 3 ) nodeVarying6 : vec4<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = vec4<f32>( vec3<f32>( 0.025, 0.018, 0.018 ), 1.0 );
	nodeVar2 = ( object.nodeUniform1 - nodeVarying5.w );
	DiffuseColor.w = ( DiffuseColor.w * ( ( ( 0.9 * smoothstep( 1.0, 0.7, clamp( ( nodeVar2 / nodeVarying6.w ), 0.0, 1.0 ) ) ) * ( smoothstep( 1.0, 0.72, length( ( ( ( nodeVarying7 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) * vec2<f32>( 1.0, 1.35 ) ) ) ) * 0.85 ) ) * ( step( 0.0, nodeVar2 ) * step( nodeVar2, nodeVarying6.w ) ) ) );
	Output = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar8 = ( - v_positionView.xyz.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.xyz.z ) );
	nodeVar9 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform2, object.nodeUniform3, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform6 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform7 * object.nodeUniform7 ) * nodeVar8 ) * nodeVar8 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar9;

	// result

	output.color = nodeVar9;

	return output;

}
