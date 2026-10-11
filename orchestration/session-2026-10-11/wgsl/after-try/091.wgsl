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
	nodeUniform4 : mat4x4<f32>
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar5 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) nodeVarying4 : vec4<f32>,
	@location( 1 ) nodeVarying5 : vec4<f32>,
	@location( 2 ) nodeVarying6 : vec2<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar2 = ( object.nodeUniform1 - nodeVarying4.w );
	nodeVar3 = clamp( ( nodeVar2 / nodeVarying5.w ), 0.0, 1.0 );
	DiffuseColor = vec4<f32>( mix( vec3<f32>( 4.0, 2.3, 0.8 ), vec3<f32>( 2.2, 0.5, 0.07 ), smoothstep( 0.0, 0.8, nodeVar3 ) ), 1.0 );
	nodeVar4 = length( ( ( nodeVarying6 - vec2<f32>( 0.5 ) ) * vec2<f32>( 2.0 ) ) );
	DiffuseColor.w = ( DiffuseColor.w * ( ( pow( ( 1.0 - nodeVar3 ), 0.8 ) * ( pow( clamp( ( 1.0 - nodeVar4 ), 0.0, 1.0 ), 2.2 ) + ( smoothstep( 0.35, 0.0, nodeVar4 ) * 0.6 ) ) ) * ( step( 0.0, nodeVar2 ) * step( nodeVar2, nodeVarying5.w ) ) ) );
	nodeVar5 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar5;

	// result

	output.color = nodeVar5;

	return output;

}
