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
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : vec2<f32>;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : u32;
var<private> nodeVar25 : u32;
var<private> nodeVar26 : u32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : vec2<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec2<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec2<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec2<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec2<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec2<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : vec2<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec2<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : u32;
var<private> nodeVar72 : u32;
var<private> nodeVar73 : u32;
var<private> nodeVar74 : u32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar78 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }


@fragment
fn main( @location( 0 ) v_positionWorld : vec3<f32>,
	@location( 1 ) nodeVarying5 : f32,
	@location( 2 ) nodeVarying6 : f32 ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( nodeVarying5 / 0.3 );
	nodeVar1 = floor( nodeVar0 );
	nodeVar2 = ( ( u32( ( ( nodeVar1 * 1.9 ) + 13.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar3 = ( ( ( nodeVar2 >> ( ( nodeVar2 >> 28u ) + 4u ) ) ^ nodeVar2 ) * 277803737u );
	nodeVar4 = ( ( u32( ( nodeVar1 + 5.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar5 = ( ( ( nodeVar4 >> ( ( nodeVar4 >> 28u ) + 4u ) ) ^ nodeVar4 ) * 277803737u );
	nodeVar6 = ( 1.5 * ( ( ( f32( ( ( nodeVar5 >> 22u ) ^ nodeVar5 ) ) * 2.3283064365386963e-10 ) * 0.5 ) + 0.78 ) );
	nodeVar7 = ( ( nodeVarying6 + ( ( f32( ( ( nodeVar3 >> 22u ) ^ nodeVar3 ) ) * 2.3283064365386963e-10 ) * nodeVar6 ) ) / nodeVar6 );
	nodeVar8 = ( ( u32( ( ( nodeVar1 * 91.7 ) + floor( nodeVar7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar9 = ( ( ( nodeVar8 >> ( ( nodeVar8 >> 28u ) + 4u ) ) ^ nodeVar8 ) * 277803737u );
	nodeVar10 = ( f32( ( ( nodeVar9 >> 22u ) ^ nodeVar9 ) ) * 2.3283064365386963e-10 );
	nodeVar11 = fract( ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar12 = ( nodeVar11.z * 64.0 );
	nodeVar13 = floor( nodeVar12 );
	nodeVar14 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar13, 8.0 ), floor( ( nodeVar13 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar11.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar15 = ( v_positionWorld.y - 9.9 );
	nodeVar16 = fract( ( vec3<f32>( ( nodeVarying6 * 2.1 ), ( nodeVarying5 * 0.25 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar17 = ( nodeVar16.z * 64.0 );
	nodeVar18 = floor( nodeVar17 );
	nodeVar19 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar18, 8.0 ), floor( ( nodeVar18 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar16.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar20 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar15 ) ) * 0.95 ), ( ( ( mix( nodeVar19.x, nodeVar19.y, ( nodeVar17 - nodeVar18 ) ) * 0.5 ) + 0.5 ) * 0.38 ) ) * 0.8 );
	nodeVar21 = ( smoothstep( 0.0, 0.5, ( ( mix( nodeVar14.x, nodeVar14.y, ( nodeVar12 - nodeVar13 ) ) + ( nodeVar20 * 0.9 ) ) - 0.15 ) ) * nodeVar20 );
	nodeVar22 = mix( 0.62, 1.0, smoothstep( 0.0, 0.7, nodeVar15 ) );
	nodeVar23 = ( ( u32( ( nodeVar10 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar24 = ( ( ( nodeVar23 >> ( ( nodeVar23 >> 28u ) + 4u ) ) ^ nodeVar23 ) * 277803737u );
	nodeVar25 = ( ( u32( nodeVar10 ) * 747796405u ) + 2891336453u );
	nodeVar26 = ( ( ( nodeVar25 >> ( ( nodeVar25 >> 28u ) + 4u ) ) ^ nodeVar25 ) * 277803737u );
	nodeVar27 = fract( ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar10 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar28 = ( nodeVar27.z * 64.0 );
	nodeVar29 = floor( nodeVar28 );
	nodeVar30 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar29, 8.0 ), floor( ( nodeVar29 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar27.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar31 = fract( ( ( v_positionWorld * vec3<f32>( 23.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar32 = ( nodeVar31.z * 64.0 );
	nodeVar33 = floor( nodeVar32 );
	nodeVar34 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar33, 8.0 ), floor( ( nodeVar33 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar31.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar35 = fract( nodeVar0 );
	nodeVar36 = fract( nodeVar7 );
	nodeVar37 = min( ( min( nodeVar35, ( 1.0 - nodeVar35 ) ) * 0.3 ), ( min( nodeVar36, ( 1.0 - nodeVar36 ) ) * nodeVar6 ) );
	nodeVar38 = ( fwidth( nodeVar37 ) + 0.0015 );
	nodeVar39 = ( 1.0 - smoothstep( 0.012, 0.05, nodeVar38 ) );
	nodeVar40 = fract( ( ( ( v_positionWorld * vec3<f32>( 8.1 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar41 = ( nodeVar40.z * 64.0 );
	nodeVar42 = floor( nodeVar41 );
	nodeVar43 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar42, 8.0 ), floor( ( nodeVar42 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar40.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar44 = fract( ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar45 = ( nodeVar44.z * 64.0 );
	nodeVar46 = floor( nodeVar45 );
	nodeVar47 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar46, 8.0 ), floor( ( nodeVar46 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar44.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar48 = fract( ( ( v_positionWorld * vec3<f32>( 31.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar49 = ( nodeVar48.z * 64.0 );
	nodeVar50 = floor( nodeVar49 );
	nodeVar51 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar50, 8.0 ), floor( ( nodeVar50 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar48.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar52 = ( ( nodeVar37 + ( mix( nodeVar47.x, nodeVar47.y, ( nodeVar45 - nodeVar46 ) ) * 0.014 ) ) + ( ( mix( nodeVar51.x, nodeVar51.y, ( nodeVar49 - nodeVar50 ) ) * 0.005 ) * nodeVar39 ) );
	nodeVar53 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar54 = fract( ( ( nodeVar53 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar55 = ( nodeVar54.z * 64.0 );
	nodeVar56 = floor( nodeVar55 );
	nodeVar57 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar56, 8.0 ), floor( ( nodeVar56 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar54.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar58 = fract( ( ( ( nodeVar53 * vec3<f32>( 2.9 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar59 = ( nodeVar58.z * 64.0 );
	nodeVar60 = floor( nodeVar59 );
	nodeVar61 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar60, 8.0 ), floor( ( nodeVar60 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar58.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar62 = fract( ( ( ( nodeVar53 * vec3<f32>( 2.9 ) ) + vec3<f32>( 13.1 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar63 = ( nodeVar62.z * 64.0 );
	nodeVar64 = floor( nodeVar63 );
	nodeVar65 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar64, 8.0 ), floor( ( nodeVar64 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar62.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar66 = fract( ( ( nodeVar53 + ( vec3<f32>( mix( nodeVar57.x, nodeVar57.y, ( nodeVar55 - nodeVar56 ) ), mix( nodeVar61.x, nodeVar61.y, ( nodeVar59 - nodeVar60 ) ), mix( nodeVar65.x, nodeVar65.y, ( nodeVar63 - nodeVar64 ) ) ) * vec3<f32>( 0.4 ) ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar67 = ( nodeVar66.z * 64.0 );
	nodeVar68 = floor( nodeVar67 );
	nodeVar69 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar68, 8.0 ), floor( ( nodeVar68 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar66.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar70 = abs( mix( nodeVar69.x, nodeVar69.y, ( nodeVar67 - nodeVar68 ) ) );
	nodeVar71 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar72 = ( ( ( nodeVar71 >> ( ( nodeVar71 >> 28u ) + 4u ) ) ^ nodeVar71 ) * 277803737u );
	nodeVar73 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar74 = ( ( ( nodeVar73 >> ( ( nodeVar73 >> 28u ) + 4u ) ) ^ nodeVar73 ) * 277803737u );
	nodeVar75 = ( 0.022 + ( ( f32( ( ( nodeVar74 >> 22u ) ^ nodeVar74 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar76 = smoothstep( ( nodeVar75 - ( nodeVar38 * 0.9 ) ), ( nodeVar75 + ( nodeVar38 * 0.9 ) ), nodeVar52 );
	nodeVar77 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, ( ( mix( nodeVar30.x, nodeVar30.y, ( nodeVar28 - nodeVar29 ) ) * 0.5 ) + 0.5 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( mix( nodeVar34.x, nodeVar34.y, ( nodeVar32 - nodeVar33 ) ) * nodeVar39 ) * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( ( smoothstep( 0.52, 0.74, mix( nodeVar43.x, nodeVar43.y, ( nodeVar41 - nodeVar42 ) ) ) * nodeVar39 ) * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar52 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar52 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar52 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar70 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar70 ) ) * step( 0.7525, ( f32( ( ( nodeVar72 >> 22u ) ^ nodeVar72 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar76 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.0 ) * 0.0 ) * nodeVar76 ) ) * 0.78 ) ) ) );
	DiffuseColor = vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), ( 1.0 * vec4<f32>( mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar21 * 0.9 ) ) * vec3<f32>( nodeVar22 ) ), ( ( mix( nodeVar77, ( nodeVar77 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar21 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar20 * 0.38 ) ) ) ) * vec3<f32>( nodeVar22 ) ), nodeVar76 ), 1.0 ).w ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	nodeVar78 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar78;

	// result

	output.color = nodeVar78;

	return output;

}
