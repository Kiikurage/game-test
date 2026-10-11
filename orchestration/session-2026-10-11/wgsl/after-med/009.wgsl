// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform2 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec2<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar8 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }


@fragment
fn main( @location( 0 ) v_positionWorld : vec3<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = fract( ( ( v_positionWorld * vec3<f32>( 2.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar1 = ( nodeVar0.z * 64.0 );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar2, 8.0 ), floor( ( nodeVar2 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar0.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar4 = fract( ( ( v_positionWorld * vec3<f32>( 9.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar5 = ( nodeVar4.z * 64.0 );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar6, 8.0 ), floor( ( nodeVar6 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar4.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	DiffuseColor = vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), ( 1.0 * vec4<f32>( vec3<f32>( ( ( 0.86 + ( mix( nodeVar3.x, nodeVar3.y, ( nodeVar1 - nodeVar2 ) ) * 0.2 ) ) + ( mix( nodeVar7.x, nodeVar7.y, ( nodeVar5 - nodeVar6 ) ) * 0.12 ) ) ), 1.0 ).w ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	nodeVar8 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar8;

	// result

	output.color = nodeVar8;

	return output;

}
