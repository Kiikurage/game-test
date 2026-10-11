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
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec4<f32>;

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

	DiffuseColor = vec4<f32>( mix( vec3<f32>( 0.07, 0.065, 0.06 ), vec3<f32>( 0.42, 0.31, 0.22 ), smoothstep( 0.3, 0.9, nodeVarying5.z ) ), 1.0 );
	nodeVar3 = ( object.nodeUniform1 - nodeVarying6.w );
	nodeVar4 = clamp( ( nodeVar3 / nodeVarying7.w ), 0.0, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * ( ( ( ( smoothstep( 0.0, 0.08, nodeVar4 ) * smoothstep( 1.0, 0.55, nodeVar4 ) ) * 0.9 ) * ( smoothstep( 1.0, 0.72, length( ( ( ( nodeVarying8 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) * vec2<f32>( 1.0, 1.35 ) ) ) ) * 0.85 ) ) * ( step( 0.0, nodeVar3 ) * step( nodeVar3, nodeVarying7.w ) ) ) );
	Output = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar10 = ( - v_positionView.xyz.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.xyz.z ) );
	nodeVar11 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform2, object.nodeUniform3, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform6 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform7 * object.nodeUniform7 ) * nodeVar10 ) * nodeVar10 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar11;

	// result

	output.color = nodeVar11;

	return output;

}
