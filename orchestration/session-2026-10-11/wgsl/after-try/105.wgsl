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
@binding( 2 ) @group( 1 ) var nodeUniform1_sampler : sampler;
@binding( 3 ) @group( 1 ) var nodeUniform1 : texture_2d<f32>;

struct renderStruct {
	nodeUniform2 : vec2<f32>,
	nodeUniform10 : f32
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform3 : f32,
	nodeUniform4 : f32,
	nodeUniform5 : f32,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32
};
@binding( 4 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> nodeVar0 : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : vec4<f32>;
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : vec3<f32>;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : vec4<f32>;
var<private> nodeVar11 : vec4<f32>;
var<private> nodeVar12 : vec4<f32>;

// codes
fn fn1 ( color : vec4<f32> ) -> vec4<f32> {

	var nodeVar0 : vec4<f32>;


	if ( ( color.w == 0.0 ) ) {

		nodeVar0 = vec4<f32>( 0.0, 0.0, 0.0, 0.0 );

	} else {

		nodeVar0 = vec4<f32>( ( color.xyz / vec3<f32>( color.w ) ), color.w );

	}


	return nodeVar0;

}


fn acesFilmicToneMapping ( color : vec3<f32>, exposure : f32 ) -> vec3<f32> {

	var nodeVar0 : vec3<f32>;

	nodeVar0 = ( mat3x3<f32>( 0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777 ) * ( ( color * vec3<f32>( exposure ) ) / vec3<f32>( 0.6 ) ) );

	return clamp( ( mat3x3<f32>( 1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602 ) * ( ( ( nodeVar0 * ( nodeVar0 + vec3<f32>( 0.0245786 ) ) ) - vec3<f32>( 0.000090537 ) ) / ( ( nodeVar0 * ( ( nodeVar0 + vec3<f32>( 0.432951 ) ) * vec3<f32>( 0.983729 ) ) ) + vec3<f32>( 0.238081 ) ) ) ), vec3<f32>( 0.0 ), vec3<f32>( 1.0 ) );

}


fn sRGBTransferOETF ( color : vec3<f32> ) -> vec3<f32> {

	


	return mix( ( ( pow( color, vec3<f32>( 0.41666 ) ) * vec3<f32>( 1.055 ) ) - vec3<f32>( 0.055 ) ), ( color * vec3<f32>( 12.92 ) ), vec3<f32>( ( color <= vec3<f32>( 0.0031308 ) ) ) );

}


fn fn0 ( color : vec4<f32> ) -> vec4<f32> {

	


	return vec4<f32>( ( color.xyz * vec3<f32>( color.w ) ), color.w );

}




@fragment
fn main( @location( 0 ) nodeVarying0 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = textureSample( nodeUniform0, nodeUniform0_sampler, nodeVarying0 );
	nodeVar1 = textureSample( nodeUniform1, nodeUniform1_sampler, nodeVarying0 );
	nodeVar2 = nodeVar1;
	nodeVar3 = max( mix( vec3<f32>( dot( ( nodeVar0 + nodeVar2 ).xyz, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ), ( nodeVar0 + nodeVar2 ).xyz, 0.86 ), vec3<f32>( 0.0 ) );
	nodeVar4 = dot( ( nodeVar0 + nodeVar2 ).xyz, vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar5 = mix( nodeVar3, ( nodeVar3 * vec3<f32>( 0.9, 0.99, 1.1 ) ), ( ( 1.0 - smoothstep( 0.0, 0.35, nodeVar4 ) ) * 0.7 ) );
	nodeVar6 = length( ( ( ( fragCoord.xy / render.nodeUniform2 ) - vec2<f32>( 0.5, 0.5 ) ) * vec2<f32>( 1.0, 0.9 ) ) );
	nodeVar7 = ( mix( nodeVar5, ( nodeVar5 * vec3<f32>( 1.1, 1.0, 0.86 ) ), ( smoothstep( 0.35, 1.6, nodeVar4 ) * 0.55 ) ) * vec3<f32>( mix( 0.55, 1.0, smoothstep( 0.82, 0.28, nodeVar6 ) ) ) );
	nodeVar8 = ( ( mix( nodeVar7, vec3<f32>( dot( nodeVar7, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ), object.nodeUniform3 ) * vec3<f32>( ( 1.0 - object.nodeUniform4 ) ) ) * vec3<f32>( mix( 1.0, mix( 0.08, 1.0, smoothstep( 0.78, 0.2, nodeVar6 ) ), object.nodeUniform5 ) ) );
	nodeVar9 = ( ( 1.0 - smoothstep( 0.0, object.nodeUniform6, min( ( min( ( fragCoord.xy / render.nodeUniform2 ).x, ( 1.0 - ( fragCoord.xy / render.nodeUniform2 ).x ) ) * ( render.nodeUniform2.x / render.nodeUniform2.y ) ), min( ( fragCoord.xy / render.nodeUniform2 ).y, ( 1.0 - ( fragCoord.xy / render.nodeUniform2 ).y ) ) ) ) ) * object.nodeUniform7 );
	nodeVar10 = vec4<f32>( ( mix( mix( nodeVar8, ( nodeVar8 * vec3<f32>( 0.6 ) ), ( nodeVar9 * 0.35 ) ), vec3<f32>( 0.8, 0.05, 0.03 ), ( nodeVar9 * object.nodeUniform8 ) ) * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) ), 1.0 );
	nodeVar11 = fn1( vec4<f32>( nodeVar10.xyz, clamp( nodeVar10.w, 0.0, 1.0 ) ) );
	nodeVar12 = vec4<f32>( acesFilmicToneMapping( nodeVar11.xyz, render.nodeUniform10 ), nodeVar11.w );

	// result

	output.color = fn0( vec4<f32>( sRGBTransferOETF( nodeVar12.xyz ), nodeVar12.w ) );

	return output;

}
