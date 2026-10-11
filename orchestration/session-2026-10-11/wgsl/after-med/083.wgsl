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
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform3 : vec3<f32>,
	nodeUniform4 : f32,
	nodeUniform5 : vec3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform12 : f32
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
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) v_positionView : vec4<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) nodeVarying5 : vec4<f32>,
	@location( 3 ) nodeVarying6 : vec2<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = vec4<f32>( mix( vec3<f32>( 0.1, 0.09, 0.085 ), vec3<f32>( 0.85, 0.66, 0.46 ), smoothstep( 0.25, 0.9, nodeVarying5.z ) ), 1.0 );
	nodeVar3 = ( nodeVarying5.xyz * vec3<f32>( 40.0 ) );
	nodeVar4 = ( ( ( nodeVarying5.xyz * vec3<f32>( 40.0, 13.0, 40.0 ) ) + ( ( vec3<f32>( 0.95, -0.2, 0.4 ) * vec3<f32>( object.nodeUniform2 ) ) * vec3<f32>( ( ( sin( ( ( object.nodeUniform2 * 0.35 ) + ( nodeVarying5.x * 6.28 ) ) ) * 0.5 ) + 1.0 ) ) ) ) + ( vec3<f32>( sin( ( ( object.nodeUniform2 * 0.7 ) + nodeVar3.x ) ), ( sin( ( ( object.nodeUniform2 * 1.3 ) + nodeVar3.y ) ) * 0.5 ), cos( ( ( object.nodeUniform2 * 0.55 ) + nodeVar3.z ) ) ) * vec3<f32>( 0.55 ) ) );
	nodeVar5 = fract( ( ( nodeVar4.y - object.nodeUniform3.y ) / 13.0 ) );
	DiffuseColor.w = ( DiffuseColor.w * ( ( ( ( ( ( smoothstep( 0.5, 0.3, max( abs( ( fract( ( ( ( nodeVar4.x - object.nodeUniform3.x ) / 40.0 ) + 0.5 ) ) - 0.5 ) ), abs( ( fract( ( ( ( nodeVar4.z - object.nodeUniform3.z ) / 40.0 ) + 0.5 ) ) - 0.5 ) ) ) ) * ( smoothstep( 0.0, 0.12, nodeVar5 ) * smoothstep( 1.0, 0.8, nodeVar5 ) ) ) * ( ( abs( sin( ( ( object.nodeUniform2 * ( ( nodeVarying5.y * 2.2 ) + 0.8 ) ) + nodeVar3.y ) ) ) * 0.65 ) + 0.2 ) ) * object.nodeUniform4 ) * 0.9 ) * ( smoothstep( 1.0, 0.72, length( ( ( ( nodeVarying6 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) * vec2<f32>( 1.0, 1.35 ) ) ) ) * 0.85 ) ) * step( 0.001, object.nodeUniform4 ) ) );
	Output = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar11 = ( - v_positionView.xyz.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.xyz.z ) );
	nodeVar12 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform5, object.nodeUniform6, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform9 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform10 * object.nodeUniform10 ) * nodeVar11 ) * nodeVar11 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar12;

	// result

	output.color = nodeVar12;

	return output;

}
