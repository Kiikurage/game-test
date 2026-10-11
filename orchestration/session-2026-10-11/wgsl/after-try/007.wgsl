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
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform4 : mat4x4<f32>
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> Output : vec4<f32>;
var<private> nodeVar35 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }


@fragment
fn main( @location( 0 ) nodeVarying4 : vec3<f32>,
	@location( 1 ) nodeVarying5 : vec2<f32>,
	@location( 2 ) nodeVarying6 : vec2<f32>,
	@location( 3 ) nodeVarying7 : vec3<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying5.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying5.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying6.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying6.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying5.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying6.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying5.x * 6.3 ), ( nodeVarying5.y * 6.3 ), ( nodeVar15 * 0.37 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar23 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying5.x * 0.85 ), ( nodeVarying5.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying5.x * 0.5 ), ( nodeVarying5.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar25 = fract( nodeVar13 );
	nodeVar26 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar27 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar26 );
	nodeVar28 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying5.x * 7.1 ), ( nodeVarying5.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar29 = ( min( ( min( nodeVar25, ( 1.0 - nodeVar25 ) ) * nodeVar10 ), ( min( nodeVar27, ( 1.0 - nodeVar27 ) ) * nodeVar26 ) ) + ( nodeVar28 * 0.011 ) );
	nodeVar30 = max( fwidth( nodeVarying5.x ), fwidth( nodeVarying5.y ) );
	nodeVar31 = ( ( nodeVar30 * 0.75 ) + 0.0015 );
	nodeVar32 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar31 ), ( 0.024 + nodeVar31 ), nodeVar29 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar30 ) );
	nodeVar33 = smoothstep( 1.7, 0.0, ( ( nodeVarying7.z + ( nodeVar22 * 0.35 ) ) + ( nodeVar24 * 0.4 ) ) );
	nodeVar34 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying5.x * 2.4 ), ( nodeVarying5.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) ).x;
	DiffuseColor = vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), ( 1.0 * vec4<f32>( mix( ( ( nodeVarying4 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar22 * 0.11 ) ) + 0.0 ) + ( smoothstep( 0.4, 0.7, 0.0 ) * 0.07 ) ) + ( nodeVar23 * 0.1 ) ) + ( nodeVar24 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying7.x, nodeVarying7.y ) + ( nodeVar22 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar29 ) * ( 1.0 - nodeVar32 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar29 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar33 * 0.4 ) ) ) * ( 1.0 - ( nodeVar32 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar33 * smoothstep( 0.0, 0.55, ( nodeVar34 + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying7.z ) ) * ( 1.0 - nodeVar32 ) ) * 0.6 ) ), 1.0 ).w ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	nodeVar35 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar35;

	// result

	output.color = nodeVar35;

	return output;

}
