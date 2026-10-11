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
	nodeUniform4 : mat4x4<f32>,
	nodeUniform5 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar7 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) nodeVarying4 : vec4<f32>,
	@location( 1 ) nodeVarying5 : vec4<f32>,
	@location( 2 ) nodeVarying6 : vec4<f32>,
	@location( 3 ) nodeVarying7 : vec2<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar4 = ( object.nodeUniform1 - nodeVarying4.w );
	nodeVar5 = clamp( ( nodeVar4 / nodeVarying5.w ), 0.0, 1.0 );
	DiffuseColor = vec4<f32>( mix( vec3<f32>( 3.4, 1.2, 0.2 ), vec3<f32>( 1.2, 0.18, 0.03 ), nodeVar5 ), 1.0 );
	nodeVar6 = length( ( ( nodeVarying7 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) );
	DiffuseColor.w = ( DiffuseColor.w * ( ( ( mix( 0.4, 1.0, smoothstep( 0.1, 0.8, abs( sin( ( ( nodeVar4 * ( ( nodeVarying6.w * 16.0 ) + 8.0 ) ) + ( nodeVarying6.x * 50.0 ) ) ) ) ) ) * smoothstep( 1.0, 0.4, nodeVar5 ) ) * ( pow( clamp( ( 1.0 - nodeVar6 ), 0.0, 1.0 ), 2.2 ) + ( smoothstep( 0.35, 0.0, nodeVar6 ) * 0.6 ) ) ) * ( step( 0.0, nodeVar4 ) * step( nodeVar4, nodeVarying5.w ) ) ) );
	nodeVar7 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar7;

	// result

	output.color = nodeVar7;

	return output;

}
