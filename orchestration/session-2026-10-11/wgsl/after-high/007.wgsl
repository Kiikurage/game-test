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
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : vec2<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec2<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec2<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec2<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec2<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec2<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec2<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar61 : vec4<f32>;

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
	nodeVar22 = vec3<f32>( ( nodeVarying5.x * 6.3 ), ( nodeVarying5.y * 6.3 ), ( nodeVar15 * 0.37 ) );
	nodeVar23 = fract( ( nodeVar22 / vec3<f32>( 8.0 ) ) );
	nodeVar24 = ( nodeVar23.z * 64.0 );
	nodeVar25 = floor( nodeVar24 );
	nodeVar26 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar25, 8.0 ), floor( ( nodeVar25 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar23.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar27 = mix( nodeVar26.x, nodeVar26.y, ( nodeVar24 - nodeVar25 ) );
	nodeVar28 = fract( ( vec3<f32>( ( nodeVarying5.x * 21.0 ), ( nodeVarying5.y * 21.0 ), nodeVar15 ) / vec3<f32>( 8.0 ) ) );
	nodeVar29 = ( nodeVar28.z * 64.0 );
	nodeVar30 = floor( nodeVar29 );
	nodeVar31 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar30, 8.0 ), floor( ( nodeVar30 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar28.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar32 = fract( ( ( nodeVar22 * vec3<f32>( 2.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar33 = ( nodeVar32.z * 64.0 );
	nodeVar34 = floor( nodeVar33 );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar34, 8.0 ), floor( ( nodeVar34 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar32.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar36 = fract( ( vec3<f32>( ( nodeVarying5.x * 0.85 ), ( nodeVarying5.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar37 = ( nodeVar36.z * 64.0 );
	nodeVar38 = floor( nodeVar37 );
	nodeVar39 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar38, 8.0 ), floor( ( nodeVar38 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar36.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar40 = fract( ( vec3<f32>( ( nodeVarying5.x * 0.5 ), ( nodeVarying5.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) );
	nodeVar41 = ( nodeVar40.z * 64.0 );
	nodeVar42 = floor( nodeVar41 );
	nodeVar43 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar42, 8.0 ), floor( ( nodeVar42 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar40.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar44 = mix( nodeVar43.x, nodeVar43.y, ( nodeVar41 - nodeVar42 ) );
	nodeVar45 = fract( nodeVar13 );
	nodeVar46 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar47 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar46 );
	nodeVar48 = fract( ( vec3<f32>( ( nodeVarying5.x * 7.1 ), ( nodeVarying5.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) );
	nodeVar49 = ( nodeVar48.z * 64.0 );
	nodeVar50 = floor( nodeVar49 );
	nodeVar51 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar50, 8.0 ), floor( ( nodeVar50 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar48.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar52 = ( min( ( min( nodeVar45, ( 1.0 - nodeVar45 ) ) * nodeVar10 ), ( min( nodeVar47, ( 1.0 - nodeVar47 ) ) * nodeVar46 ) ) + ( mix( nodeVar51.x, nodeVar51.y, ( nodeVar49 - nodeVar50 ) ) * 0.011 ) );
	nodeVar53 = max( fwidth( nodeVarying5.x ), fwidth( nodeVarying5.y ) );
	nodeVar54 = ( ( nodeVar53 * 0.75 ) + 0.0015 );
	nodeVar55 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar54 ), ( 0.024 + nodeVar54 ), nodeVar52 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar53 ) );
	nodeVar56 = smoothstep( 1.7, 0.0, ( ( nodeVarying7.z + ( nodeVar27 * 0.35 ) ) + ( nodeVar44 * 0.4 ) ) );
	nodeVar57 = fract( ( vec3<f32>( ( nodeVarying5.x * 2.4 ), ( nodeVarying5.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) );
	nodeVar58 = ( nodeVar57.z * 64.0 );
	nodeVar59 = floor( nodeVar58 );
	nodeVar60 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar59, 8.0 ), floor( ( nodeVar59 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar57.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	DiffuseColor = vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), ( 1.0 * vec4<f32>( mix( ( ( nodeVarying4 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar27 * 0.11 ) ) + ( mix( nodeVar31.x, nodeVar31.y, ( nodeVar29 - nodeVar30 ) ) * 0.07 ) ) + ( smoothstep( 0.4, 0.7, mix( nodeVar35.x, nodeVar35.y, ( nodeVar33 - nodeVar34 ) ) ) * 0.07 ) ) + ( mix( nodeVar39.x, nodeVar39.y, ( nodeVar37 - nodeVar38 ) ) * 0.1 ) ) + ( nodeVar44 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying7.x, nodeVarying7.y ) + ( nodeVar27 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar52 ) * ( 1.0 - nodeVar55 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar52 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar56 * 0.4 ) ) ) * ( 1.0 - ( nodeVar55 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar56 * smoothstep( 0.0, 0.55, ( mix( nodeVar60.x, nodeVar60.y, ( nodeVar58 - nodeVar59 ) ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying7.z ) ) * ( 1.0 - nodeVar55 ) ) * 0.6 ) ), 1.0 ).w ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	nodeVar61 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar61;

	// result

	output.color = nodeVar61;

	return output;

}
