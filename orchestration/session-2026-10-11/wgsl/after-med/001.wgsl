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
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : u32;
var<private> nodeVar15 : u32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> Output : vec4<f32>;
var<private> nodeVar19 : vec4<f32>;

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
	nodeVar12 = ( positionWorldDirection * vec3<f32>( 240.0 ) );
	nodeVar13 = floor( nodeVar12 );
	nodeVar14 = ( ( u32( ( ( nodeVar13.x + ( nodeVar13.y * 57.3 ) ) + ( nodeVar13.z * 131.7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar15 = ( ( ( nodeVar14 >> ( ( nodeVar14 >> 28u ) + 4u ) ) ^ nodeVar14 ) * 277803737u );
	nodeVar16 = ( f32( ( ( nodeVar15 >> 22u ) ^ nodeVar15 ) ) * 2.3283064365386963e-10 );
	nodeVar17 = ( ( u32( ( nodeVar16 * 91.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	DiffuseColor = ( vec4<f32>( mix( ( object.nodeUniform0 * vec3<f32>( 0.9 ) ), ( mix( ( mix( mix( mix( object.nodeUniform1, object.nodeUniform2, smoothstep( 0.0, 0.28, nodeVar0 ) ), object.nodeUniform4, smoothstep( 0.15, 0.85, nodeVar0 ) ), ( object.nodeUniform1 * vec3<f32>( 1.15 ) ), ( pow( nodeVar1, 3.0 ) * smoothstep( 0.5, 0.0, nodeVar0 ) ) ) + ( ( object.nodeUniform6 * vec3<f32>( ( ( ( pow( nodeVar1, 8.0 ) * 0.55 ) + ( pow( nodeVar1, 90.0 ) * 1.4 ) ) + ( smoothstep( 0.99955, 0.99985, nodeVar1 ) * 24.0 ) ) ) ) * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) ) ), mix( ( object.nodeUniform2 * vec3<f32>( 0.85 ) ), ( object.nodeUniform6 * vec3<f32>( 1.1 ) ), ( ( pow( nodeVar1, 2.0 ) * 0.7 ) + 0.15 ) ), ( ( ( smoothstep( 0.58, 0.88, ( ( ( mix( nodeVar7.x, nodeVar7.y, ( nodeVar5 - nodeVar6 ) ) + ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.5 ) ) * 0.5 ) + 0.5 ) ) * smoothstep( 0.02, 0.3, positionWorldDirection.y ) ) * smoothstep( 0.85, 0.4, positionWorldDirection.y ) ) * 0.5 ) ) + ( ( ( vec3<f32>( 0.8, 0.86, 1.0 ) * vec3<f32>( ( ( ( step( 0.9988, nodeVar16 ) * smoothstep( 0.42, 0.0, length( ( fract( nodeVar12 ) - vec3<f32>( 0.5 ) ) ) ) ) * ( ( ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ) * 0.7 ) + 0.5 ) ) * smoothstep( 0.32, 0.75, nodeVar0 ) ) ) ) * vec3<f32>( object.nodeUniform7 ) ) * vec3<f32>( 2.2 ) ) ), smoothstep( -0.06, 0.02, positionWorldDirection.y ) ), 1.0 ) * vec4<f32>( render.nodeUniform10 ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform11 );
	DiffuseColor.w = 1.0;
	nodeVar19 = max( vec4<f32>( DiffuseColor.xyz, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar19;

	// result

	output.color = nodeVar19;

	return output;

}
