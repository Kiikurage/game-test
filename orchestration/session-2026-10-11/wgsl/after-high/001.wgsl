// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform8_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform8 : texture_2d<f32>;

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : vec3<f32>,
	nodeUniform2 : vec3<f32>,
	nodeUniform3 : mat4x4<f32>,
	nodeUniform4 : vec3<f32>,
	nodeUniform5 : vec3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : f32,
	nodeUniform11 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform9 : f32,
	nodeUniform10 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> positionWorldDirection : vec3<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : vec2<f32>;
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : vec2<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec2<f32>;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec2<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : u32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : u32;
var<private> nodeVar26 : u32;
var<private> Output : vec4<f32>;
var<private> nodeVar27 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }


@fragment
fn main( @location( 0 ) v_positionWorldDirection : vec3<f32> ) -> OutputStruct {

	// flow
	// code

	positionWorldDirection = normalize( v_positionWorldDirection );
	nodeVar0 = clamp( positionWorldDirection.y, 0.0, 1.0 );
	nodeVar1 = clamp( dot( positionWorldDirection, object.nodeUniform5 ), 0.0, 1.0 );
	nodeVar2 = ( ( vec2<f32>( positionWorldDirection.x, positionWorldDirection.z ) / vec2<f32>( max( ( positionWorldDirection.y + 0.18 ), 0.06 ) ) ) * vec2<f32>( 1.2 ) );
	nodeVar3 = vec3<f32>( nodeVar2.x, ( nodeVar2.y * 3.2 ), 0.0 );
	nodeVar4 = fract( ( nodeVar3 / vec3<f32>( 8.0 ) ) );
	nodeVar5 = ( nodeVar4.z * 64.0 );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = textureSampleLevel( nodeUniform8, nodeUniform8_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar6, 8.0 ), floor( ( nodeVar6 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar4.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ), render.nodeUniform9 ).xy;
	nodeVar8 = fract( ( ( nodeVar3 * vec3<f32>( 2.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar9 = ( nodeVar8.z * 64.0 );
	nodeVar10 = floor( nodeVar9 );
	nodeVar11 = textureSampleLevel( nodeUniform8, nodeUniform8_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar10, 8.0 ), floor( ( nodeVar10 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar8.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ), render.nodeUniform9 ).xy;
	nodeVar12 = fract( ( ( nodeVar3 * vec3<f32>( 4.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar13 = ( nodeVar12.z * 64.0 );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = textureSampleLevel( nodeUniform8, nodeUniform8_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar14, 8.0 ), floor( ( nodeVar14 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar12.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ), render.nodeUniform9 ).xy;
	nodeVar16 = fract( ( ( nodeVar3 * vec3<f32>( 8.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar17 = ( nodeVar16.z * 64.0 );
	nodeVar18 = floor( nodeVar17 );
	nodeVar19 = textureSampleLevel( nodeUniform8, nodeUniform8_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar18, 8.0 ), floor( ( nodeVar18 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar16.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ), render.nodeUniform9 ).xy;
	nodeVar20 = ( positionWorldDirection * vec3<f32>( 240.0 ) );
	nodeVar21 = floor( nodeVar20 );
	nodeVar22 = ( ( u32( ( ( nodeVar21.x + ( nodeVar21.y * 57.3 ) ) + ( nodeVar21.z * 131.7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar23 = ( ( ( nodeVar22 >> ( ( nodeVar22 >> 28u ) + 4u ) ) ^ nodeVar22 ) * 277803737u );
	nodeVar24 = ( f32( ( ( nodeVar23 >> 22u ) ^ nodeVar23 ) ) * 2.3283064365386963e-10 );
	nodeVar25 = ( ( u32( ( nodeVar24 * 91.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar26 = ( ( ( nodeVar25 >> ( ( nodeVar25 >> 28u ) + 4u ) ) ^ nodeVar25 ) * 277803737u );
	DiffuseColor = ( vec4<f32>( mix( ( object.nodeUniform0 * vec3<f32>( 0.9 ) ), ( mix( ( mix( mix( mix( object.nodeUniform1, object.nodeUniform2, smoothstep( 0.0, 0.28, nodeVar0 ) ), object.nodeUniform4, smoothstep( 0.15, 0.85, nodeVar0 ) ), ( object.nodeUniform1 * vec3<f32>( 1.15 ) ), ( pow( nodeVar1, 3.0 ) * smoothstep( 0.5, 0.0, nodeVar0 ) ) ) + ( ( object.nodeUniform6 * vec3<f32>( ( ( ( pow( nodeVar1, 8.0 ) * 0.55 ) + ( pow( nodeVar1, 90.0 ) * 1.4 ) ) + ( smoothstep( 0.99955, 0.99985, nodeVar1 ) * 24.0 ) ) ) ) * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) ) ), mix( ( object.nodeUniform2 * vec3<f32>( 0.85 ) ), ( object.nodeUniform6 * vec3<f32>( 1.1 ) ), ( ( pow( nodeVar1, 2.0 ) * 0.7 ) + 0.15 ) ), ( ( ( smoothstep( 0.58, 0.88, ( ( ( ( ( mix( nodeVar7.x, nodeVar7.y, ( nodeVar5 - nodeVar6 ) ) + ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.5 ) ) + ( mix( nodeVar15.x, nodeVar15.y, ( nodeVar13 - nodeVar14 ) ) * 0.25 ) ) + ( mix( nodeVar19.x, nodeVar19.y, ( nodeVar17 - nodeVar18 ) ) * 0.125 ) ) * 0.5 ) + 0.5 ) ) * smoothstep( 0.02, 0.3, positionWorldDirection.y ) ) * smoothstep( 0.85, 0.4, positionWorldDirection.y ) ) * 0.5 ) ) + ( ( ( vec3<f32>( 0.8, 0.86, 1.0 ) * vec3<f32>( ( ( ( step( 0.9988, nodeVar24 ) * smoothstep( 0.42, 0.0, length( ( fract( nodeVar20 ) - vec3<f32>( 0.5 ) ) ) ) ) * ( ( ( f32( ( ( nodeVar26 >> 22u ) ^ nodeVar26 ) ) * 2.3283064365386963e-10 ) * 0.7 ) + 0.5 ) ) * smoothstep( 0.32, 0.75, nodeVar0 ) ) ) ) * vec3<f32>( object.nodeUniform7 ) ) * vec3<f32>( 2.2 ) ) ), smoothstep( -0.06, 0.02, positionWorldDirection.y ) ), 1.0 ) * vec4<f32>( render.nodeUniform10 ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform11 );
	DiffuseColor.w = 1.0;
	nodeVar27 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar27;

	// result

	output.color = nodeVar27;

	return output;

}
