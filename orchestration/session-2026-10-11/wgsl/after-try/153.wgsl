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
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : u32;
var<private> nodeVar32 : u32;
var<private> nodeVar33 : u32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar39 : vec4<f32>;

// codes


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
	nodeVar11 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 2.4 ) ) + vec3<f32>( nodeVar10 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar12 = ( v_positionWorld.y - 9.9 );
	nodeVar13 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying6 * 2.1 ), ( nodeVarying5 * 0.25 ), 3.3 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar14 = ( max( ( ( 1.0 - smoothstep( 0.1, 1.5, nodeVar12 ) ) * 0.95 ), ( ( ( nodeVar13 * 0.5 ) + 0.5 ) * 0.38 ) ) * 0.8 );
	nodeVar15 = ( smoothstep( 0.0, 0.5, ( ( nodeVar11 + ( nodeVar14 * 0.9 ) ) - 0.15 ) ) * nodeVar14 );
	nodeVar16 = mix( 0.62, 1.0, smoothstep( 0.0, 0.7, nodeVar12 ) );
	nodeVar17 = ( ( u32( ( nodeVar10 + 17.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	nodeVar19 = ( ( u32( nodeVar10 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( v_positionWorld * vec3<f32>( 0.85 ) ) + vec3<f32>( ( nodeVar10 * 1.7 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar22 = fract( nodeVar0 );
	nodeVar23 = fract( nodeVar7 );
	nodeVar24 = min( ( min( nodeVar22, ( 1.0 - nodeVar22 ) ) * 0.3 ), ( min( nodeVar23, ( 1.0 - nodeVar23 ) ) * nodeVar6 ) );
	nodeVar25 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 9.5 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar26 = ( ( nodeVar24 + ( nodeVar25 * 0.014 ) ) + 0.0 );
	nodeVar27 = ( ( v_positionWorld * vec3<f32>( 2.6 ) ) + vec3<f32>( ( nodeVar10 * 3.1 ) ) );
	nodeVar28 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar27 * vec3<f32>( 2.9 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar29 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( nodeVar27 + vec3<f32>( ( nodeVar28 * 0.4 ) ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar30 = abs( nodeVar29 );
	nodeVar31 = ( ( u32( ( nodeVar10 + 3.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar32 = ( ( ( nodeVar31 >> ( ( nodeVar31 >> 28u ) + 4u ) ) ^ nodeVar31 ) * 277803737u );
	nodeVar33 = ( ( u32( ( nodeVar10 + 9.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar34 = ( ( ( nodeVar33 >> ( ( nodeVar33 >> 28u ) + 4u ) ) ^ nodeVar33 ) * 277803737u );
	nodeVar35 = ( 0.022 + ( ( f32( ( ( nodeVar34 >> 22u ) ^ nodeVar34 ) ) * 2.3283064365386963e-10 ) * 0.012 ) );
	nodeVar36 = ( fwidth( nodeVar24 ) + 0.0015 );
	nodeVar37 = smoothstep( ( nodeVar35 - ( nodeVar36 * 0.9 ) ), ( nodeVar35 + ( nodeVar36 * 0.9 ) ), nodeVar26 );
	nodeVar38 = ( ( ( ( ( ( ( ( vec3<f32>( 0.215, 0.205, 0.192 ) * mix( vec3<f32>( 0.83, 0.92, 1.05 ), vec3<f32>( 1.07, 0.97, 0.8 ), ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ) ) ) * vec3<f32>( ( 0.5 + ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.85 ) ) ) ) * vec3<f32>( mix( 0.74, 1.14, ( ( nodeVar21 * 0.5 ) + 0.5 ) ) ) ) * vec3<f32>( ( 1.0 + ( 0.0 * 0.15 ) ) ) ) * vec3<f32>( ( 1.0 - ( 0.0 * 0.3 ) ) ) ) * vec3<f32>( mix( 0.68, 1.0, smoothstep( 0.0, 0.17, nodeVar26 ) ) ) ) * vec3<f32>( ( 1.0 + ( ( smoothstep( 0.02, 0.05, nodeVar26 ) * ( 1.0 - smoothstep( 0.05, 0.11, nodeVar26 ) ) ) * 0.14 ) ) ) ) * vec3<f32>( ( 1.0 - ( max( ( ( ( 1.0 - smoothstep( 0.016, ( ( ( fwidth( nodeVar30 ) + 0.002 ) * 1.6 ) + 0.016 ), nodeVar30 ) ) * step( 0.7525, ( f32( ( ( nodeVar32 >> 22u ) ^ nodeVar32 ) ) * 2.3283064365386963e-10 ) ) ) * nodeVar37 ), ( ( ( ( 1.0 - smoothstep( 0.012, ( 0.012 + ( ( fwidth( 1.0 ) + 0.0015 ) * 1.6 ) ), 1.0 ) ) * 0.0 ) * 0.0 ) * nodeVar37 ) ) * 0.78 ) ) ) );
	DiffuseColor = vec4<f32>( vec3<f32>( 0.0, 0.0, 0.0 ), ( 1.0 * vec4<f32>( mix( ( mix( vec3<f32>( 0.045, 0.041, 0.038 ), vec3<f32>( 0.07, 0.092, 0.04 ), ( nodeVar15 * 0.9 ) ) * vec3<f32>( nodeVar16 ) ), ( ( mix( nodeVar38, ( nodeVar38 * vec3<f32>( 0.62, 0.78, 0.5 ) ), ( nodeVar15 * 0.7 ) ) * vec3<f32>( ( 1.0 - ( nodeVar14 * 0.38 ) ) ) ) * vec3<f32>( nodeVar16 ) ), nodeVar37 ), 1.0 ).w ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform2 );
	nodeVar39 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar39;

	// result

	output.color = nodeVar39;

	return output;

}
