// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : vec3<f32>,
	nodeUniform2 : vec3<f32>,
	nodeUniform3 : mat4x4<f32>,
	nodeUniform5 : vec3<f32>,
	nodeUniform6 : vec3<f32>,
	nodeUniform7 : vec3<f32>,
	nodeUniform8 : f32,
	nodeUniform10 : f32,
	nodeUniform14 : mat3x3<f32>
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	cameraPosition : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : vec3<f32>;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec2<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : vec2<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : u32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : u32;
var<private> Output : vec4<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar25 : vec4<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar29 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }


@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = normalize( ( v_positionWorld - render.cameraPosition ) );
	nodeVar1 = clamp( nodeVar0.y, 0.0, 1.0 );
	nodeVar2 = clamp( dot( nodeVar0, object.nodeUniform6 ), 0.0, 1.0 );
	nodeVar3 = ( ( vec2<f32>( nodeVar0.x, nodeVar0.z ) / vec2<f32>( max( ( nodeVar0.y + 0.18 ), 0.06 ) ) ) * vec2<f32>( 1.2 ) );
	nodeVar4 = vec3<f32>( nodeVar3.x, ( nodeVar3.y * 3.2 ), 0.0 );
	nodeVar5 = fract( ( nodeVar4 / vec3<f32>( 8.0 ) ) );
	nodeVar6 = ( nodeVar5.z * 64.0 );
	nodeVar7 = floor( nodeVar6 );
	nodeVar8 = textureSample( nodeUniform9, nodeUniform9_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar7, 8.0 ), floor( ( nodeVar7 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar5.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar9 = fract( ( ( nodeVar4 * vec3<f32>( 2.0 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar10 = ( nodeVar9.z * 64.0 );
	nodeVar11 = floor( nodeVar10 );
	nodeVar12 = textureSample( nodeUniform9, nodeUniform9_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar11, 8.0 ), floor( ( nodeVar11 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar9.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar13 = ( nodeVar0 * vec3<f32>( 240.0 ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( ( u32( ( ( nodeVar14.x + ( nodeVar14.y * 57.3 ) ) + ( nodeVar14.z * 131.7 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar16 = ( ( ( nodeVar15 >> ( ( nodeVar15 >> 28u ) + 4u ) ) ^ nodeVar15 ) * 277803737u );
	nodeVar17 = ( f32( ( ( nodeVar16 >> 22u ) ^ nodeVar16 ) ) * 2.3283064365386963e-10 );
	nodeVar18 = ( ( u32( ( nodeVar17 * 91.7 ) ) * 747796405u ) + 2891336453u );
	nodeVar19 = ( ( ( nodeVar18 >> ( ( nodeVar18 >> 28u ) + 4u ) ) ^ nodeVar18 ) * 277803737u );
	DiffuseColor = vec4<f32>( mix( ( object.nodeUniform0 * vec3<f32>( 0.9 ) ), ( mix( ( mix( mix( mix( object.nodeUniform1, object.nodeUniform2, smoothstep( 0.0, 0.28, nodeVar1 ) ), object.nodeUniform5, smoothstep( 0.15, 0.85, nodeVar1 ) ), ( object.nodeUniform1 * vec3<f32>( 1.15 ) ), ( pow( nodeVar2, 3.0 ) * smoothstep( 0.5, 0.0, nodeVar1 ) ) ) + ( ( object.nodeUniform7 * vec3<f32>( ( ( ( pow( nodeVar2, 8.0 ) * 0.55 ) + ( pow( nodeVar2, 90.0 ) * 1.4 ) ) + ( smoothstep( 0.99955, 0.99985, nodeVar2 ) * 24.0 ) ) ) ) * vec3<f32>( ( 1.0 - object.nodeUniform8 ) ) ) ), mix( ( object.nodeUniform2 * vec3<f32>( 0.85 ) ), ( object.nodeUniform7 * vec3<f32>( 1.1 ) ), ( ( pow( nodeVar2, 2.0 ) * 0.7 ) + 0.15 ) ), ( ( ( smoothstep( 0.58, 0.88, ( ( ( mix( nodeVar8.x, nodeVar8.y, ( nodeVar6 - nodeVar7 ) ) + ( mix( nodeVar12.x, nodeVar12.y, ( nodeVar10 - nodeVar11 ) ) * 0.5 ) ) * 0.5 ) + 0.5 ) ) * smoothstep( 0.02, 0.3, nodeVar0.y ) ) * smoothstep( 0.85, 0.4, nodeVar0.y ) ) * 0.5 ) ) + ( ( ( vec3<f32>( 0.8, 0.86, 1.0 ) * vec3<f32>( ( ( ( step( 0.9988, nodeVar17 ) * smoothstep( 0.42, 0.0, length( ( fract( nodeVar13 ) - vec3<f32>( 0.5 ) ) ) ) ) * ( ( ( f32( ( ( nodeVar19 >> 22u ) ^ nodeVar19 ) ) * 2.3283064365386963e-10 ) * 0.7 ) + 0.5 ) ) * smoothstep( 0.32, 0.75, nodeVar1 ) ) ) ) * vec3<f32>( object.nodeUniform8 ) ) * vec3<f32>( 2.2 ) ) ), smoothstep( -0.06, 0.02, nodeVar0.y ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform10 );
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalViewGeometry = normalize( v_normalViewGeometry );
	normalView = normalViewGeometry;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar20 = dot( normalWorld, normalize( render.nodeUniform16 ) );
	nodeVar21 = ( nodeVar20 * 0.5 );
	nodeVar22 = ( nodeVar21 + 0.5 );
	nodeVar23 = mix( render.nodeUniform11, render.nodeUniform12, nodeVar22 );
	nodeVar24 = ( irradiance + nodeVar23 );
	irradiance = nodeVar24;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectDiffuse = vec4<f32>( 0.0, 0.0, 0.0, 0.0 ).xyz;
	nodeVar25 = ( vec4<f32>( indirectDiffuse, 1.0 ) + vec4<f32>( 1.0, 1.0, 1.0, 0.0 ) );
	indirectDiffuse = nodeVar25.xyz;
	ambientOcclusion = 1.0;
	nodeVar26 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar26;
	nodeVar27 = ( indirectDiffuse * DiffuseColor.xyz );
	indirectDiffuse = nodeVar27;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar28 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar28;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar29 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar29;
	nodeVar30 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar30;
	nodeVar31 = max( vec4<f32>( outgoingLight, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar31;

	// result

	output.color = nodeVar31;

	return output;

}
